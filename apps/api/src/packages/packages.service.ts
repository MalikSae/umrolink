import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { PackageStatus } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp') as (input: Buffer) => import('sharp').Sharp;
import * as path from 'path';
import * as fs from 'fs/promises';
import * as xss from 'xss';
import * as crypto from 'crypto';

const xssOptions = {
  whiteList: {
    p: [],
    br: [],
    strong: [],
    em: [],
    ul: [],
    ol: [],
    li: [],
  }
};
const myXss = new xss.FilterXSS(xssOptions);

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: TenantPrismaService) {}

  private validatePublish(
    pkg: { priceQuad: number | null; priceTriple: number | null; priceDouble: number | null },
    updateDto?: UpdatePackageDto
  ) {
    const isPublishing = updateDto?.status === PackageStatus.published;

    if (isPublishing) {
      const priceQuad = updateDto!.priceQuad !== undefined ? updateDto!.priceQuad : pkg.priceQuad;
      const priceTriple = updateDto!.priceTriple !== undefined ? updateDto!.priceTriple : pkg.priceTriple;
      const priceDouble = updateDto!.priceDouble !== undefined ? updateDto!.priceDouble : pkg.priceDouble;

      // Aturan baru (sprint 3+): minimal SATU harga harus terisi, tidak harus ketiganya
      const hasAtLeastOnePrice = priceQuad != null || priceTriple != null || priceDouble != null;
      if (!hasAtLeastOnePrice) {
        throw new BadRequestException(
          'Paket tidak bisa dipublish karena semua harga masih kosong. Isi minimal satu harga (Quad, Triple, atau Double).'
        );
      }
    }
  }

  async create(createPackageDto: CreatePackageDto) {
    if (createPackageDto.status === PackageStatus.published) {
      this.validatePublish({
        priceQuad: createPackageDto.priceQuad ?? null,
        priceTriple: createPackageDto.priceTriple ?? null,
        priceDouble: createPackageDto.priceDouble ?? null,
      }, createPackageDto as UpdatePackageDto);
    }

    const { departures, tempImage, status, ...packageData } = createPackageDto;

    if (packageData.description) {
      packageData.description = myXss.process(packageData.description);
    }

    let baseSlug = generateSlug(packageData.name);
    let slug = baseSlug;
    let slugExists = true;
    let counter = 1;

    // Check slug uniqueness
    while (slugExists) {
      const existing = await this.prisma.client.package.findFirst({
        where: { slug }
      });
      if (existing) {
        counter++;
        slug = `${baseSlug}-${counter}`;
      } else {
        slugExists = false;
      }
    }

    const pkg = await this.prisma.client.package.create({
      data: {
        ...packageData,
        slug,
        status: status === PackageStatus.published ? PackageStatus.published : PackageStatus.draft,
      },
    });

    if (departures && departures.length > 0) {
      // tenantId di-inject otomatis oleh Prisma Client Extension
      await this.prisma.client.packageDeparture.createMany({
        data: departures.map((d) => ({
          packageId: pkg.id,
          departureDate: new Date(d.departureDate),
          quota: d.quota,
        })),
      });
    }

    if (tempImage) {
      // Pindahkan gambar dari temp ke permanen
      const storageBase = path.join(
        __dirname,
        '..', '..',
        'storage', 'uploads', 'packages',
      );
      
      const tempPath = path.join(storageBase, 'temp', tempImage);
      const finalPath = path.join(storageBase, `${pkg.id}.webp`);
      
      try {
        await fs.rename(tempPath, finalPath);
        const featuredImagePath = `/api/uploads/packages/${pkg.id}.webp`;
        await this.prisma.client.package.update({
          where: { id: pkg.id },
          data: { featuredImage: featuredImagePath }
        });
      } catch (err) {
        console.error('Failed to move temp image:', err);
      }
    }

    return this.findOne(pkg.id);
  }

  async findAll(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { search, status, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.client.package.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { departures: true } },
        },
      }),
      this.prisma.client.package.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const pkg = await this.prisma.client.package.findFirst({
      where: { id },
      include: {
        departures: {
          orderBy: { departureDate: 'asc' },
          include: {
            _count: {
              select: { leads: { where: { status: 'confirmed' } } }
            }
          }
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    return pkg;
  }

  async update(id: string, updatePackageDto: UpdatePackageDto) {
    const pkg = await this.findOne(id);

    this.validatePublish(pkg, updatePackageDto);

    const { departures, ...packageData } = updatePackageDto;

    if (packageData.description) {
      packageData.description = myXss.process(packageData.description);
    }

    const updated = await this.prisma.client.package.update({
      where: { id },
      data: packageData,
    });

    // Replace strategy: hapus semua departure lama, buat ulang dari array baru
    if (departures !== undefined) {
      await this.prisma.client.packageDeparture.deleteMany({
        where: { packageId: id },
      });

      if (departures.length > 0) {
        await this.prisma.client.packageDeparture.createMany({
          data: departures.map((d) => ({
            packageId: id,
            departureDate: new Date(d.departureDate),
            quota: d.quota,
          })),
        });
      }
    }

    return this.findOne(updated.id);
  }

  async publish(id: string) {
    const pkg = await this.findOne(id);
    this.validatePublish(pkg, { status: PackageStatus.published });

    return this.prisma.client.package.update({
      where: { id },
      data: { status: PackageStatus.published },
    });
  }

  async toggleFeatured(id: string, featured: boolean) {
    await this.findOne(id); // Ensure package exists
    return this.prisma.client.package.update({
      where: { id },
      data: { featured },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // PackageDeparture akan terhapus otomatis via onDelete: Cascade di schema
    return this.prisma.client.package.delete({
      where: { id },
    });
  }

  async uploadFeaturedImage(id: string, file: Express.Multer.File) {
    // Pastikan paket ada (dan ter-scope ke tenant yang benar via extension)
    await this.findOne(id);

    // Pastikan folder tujuan ada
    // Dev: process.cwd() = monorepo root, tapi di production cwd = apps/api
    // Gunakan __dirname untuk resolve path relatif ke file ini (lebih reliable)
    // src/packages/packages.service.ts → ../../.. = monorepo root di dev, atau dist/packages/../../.. = dist di prod
    // Solusi paling portabel: gunakan env var atau constant absolute path dari apps/api
    const storageBase = path.join(
      __dirname, // src/packages atau dist/packages
      '..', '..', // apps/api/src atau apps/api/dist
      'storage', 'uploads', 'packages',
    );
    await fs.mkdir(storageBase, { recursive: true });

    const outputPath = path.join(storageBase, `${id}.webp`);

    // Proses sharp: resize 1200x1200 cover (rasio 1:1) + convert WebP quality 80
    // File asli TIDAK pernah ditulis ke disk — hanya file.buffer yang diproses
    await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const featuredImagePath = `/api/uploads/packages/${id}.webp`;

    // Simpan path relatif ke database
    const updated = await this.prisma.client.package.update({
      where: { id },
      data: { featuredImage: featuredImagePath },
      include: {
        departures: {
          orderBy: { departureDate: 'asc' },
        },
      },
    });

    return updated;
  }

  async uploadTempImage(file: Express.Multer.File) {
    const storageBase = path.join(
      __dirname,
      '..', '..',
      'storage', 'uploads', 'packages',
    );
    const tempDir = path.join(storageBase, 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const tempId = crypto.randomUUID();
    const tempFileName = `${tempId}.webp`;
    const outputPath = path.join(tempDir, tempFileName);

    await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Return url for preview and filename for the payload
    return {
      tempImage: tempFileName,
      url: `/api/uploads/packages/temp/${tempFileName}`,
    };
  }
}
