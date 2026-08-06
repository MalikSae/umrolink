import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { RawPrismaService } from '../tenancy/raw-prisma.service';
import { RegisterAgentDto } from './dto/register-agent.dto';
import { ClsService } from 'nestjs-cls';
import * as argon2 from 'argon2';
import { kabupatenKota } from '@umrolink/types';
import { ReferralAttributionService } from '../referral/referral-attribution.service';

@Injectable()
export class PublicService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly rawPrisma: RawPrismaService,
    private readonly cls: ClsService,
    private readonly referralService: ReferralAttributionService,
  ) {}

  async getTenant() {
    const tenantId = this.cls.get('tenantId');
    const tenant = await this.rawPrisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return {
      name: tenant.name,
      brandPrimaryColor: tenant.brandPrimaryColor,
      brandSecondaryColor: tenant.brandSecondaryColor,
      brandAccentColor: tenant.brandAccentColor,
      description: tenant.description,
      address: tenant.address,
      phoneNumber: tenant.phoneNumber,
    };
  }

  async getBanners() {
    return this.tenantPrisma.client.banner.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
  }

  async getDepartureMonths() {
    const departures = await this.tenantPrisma.client.packageDeparture.findMany({
      where: {
        package: { status: 'published' }
      },
      select: { departureDate: true },
      orderBy: { departureDate: 'asc' },
    });

    const monthsMap = new Map<string, string>();
    const formatter = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });

    for (const dep of departures) {
      const date = dep.departureDate;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthsMap.has(key)) {
        monthsMap.set(key, formatter.format(date));
      }
    }

    return Array.from(monthsMap.entries()).map(([value, label]) => ({ value, label }));
  }

  async getPackages(month?: string, featured?: boolean) {
    const whereClause: any = { status: 'published' };
    
    if (featured) {
      whereClause.featured = true;
    }

    if (month) {
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr, 10);
      const monthIdx = parseInt(monthStr, 10) - 1;
      const startDate = new Date(year, monthIdx, 1);
      const endDate = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
      
      whereClause.departures = {
        some: {
          departureDate: {
            gte: startDate,
            lte: endDate,
          }
        }
      };
    }

    return this.tenantPrisma.client.package.findMany({
      where: whereClause,
      select: {
        id: true,
        slug: true,
        name: true,
        featuredImage: true,
        featured: true,
        priceQuad: true,
        priceTriple: true,
        priceDouble: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPackageBySlug(slug: string) {
    const pkg = await this.tenantPrisma.client.package.findFirst({
      where: { slug, status: 'published' },
      select: {
        id: true,
        name: true,
        description: true,
        airline: true,
        hotelMakkah: true,
        hotelMadinah: true,
        include: true,
        exclude: true,
        priceQuad: true,
        priceTriple: true,
        priceDouble: true,
        featuredImage: true,
        departures: {
          select: {
            id: true,
            departureDate: true,
            quota: true,
            _count: {
              select: {
                leads: {
                  where: { status: 'confirmed' }
                }
              }
            }
          },
          orderBy: { departureDate: 'asc' },
        },
      }
    });

    if (!pkg) {
      throw new NotFoundException('Package not found or not published');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formattedDepartures = pkg.departures.map(d => {
      const confirmedCount = d._count.leads;
      return {
        id: d.id,
        departureDate: d.departureDate,
        quota: d.quota,
        isSold: confirmedCount >= d.quota,
        isPast: d.departureDate < today,
      };
    });

    return {
      ...pkg,
      departures: formattedDepartures
    };
  }

  async registerAgent(dto: RegisterAgentDto) {
    // 1. Cek email belum dipakai di manapun (User.email unique global)
    const existingUser = await this.rawPrisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email ini sudah terdaftar. Silakan gunakan email lain.');
    }
    
    // 1b. Cek validitas kota (city)
    const isValidCity = kabupatenKota.some(city => city.name === dto.city);
    if (!isValidCity) {
      throw new BadRequestException('Kota/Kabupaten tidak valid.');
    }

    // 2. Buat User (role='agent', passwordHash via argon2) via TenantPrismaService
    const passwordHash = await argon2.hash(dto.password);

    const tenantId = this.cls.get('tenantId');

    const newUser = await this.tenantPrisma.client.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: 'agent',
        passwordHash,
        agentProfile: {
          // 3. Buat AgentProfile terkait (status='pending', phone diisi, agentCode null)
          create: {
            tenantId,   // nested create tidak tercakup extension otomatis
            phone: dto.phone,
            city: dto.city,
            status: 'pending',
          }
        }
      }
    });

    // 4. Return pesan konfirmasi saja
    return {
      message: 'Pendaftaran berhasil. Silakan tunggu persetujuan dari tim admin kami.',
    };
  }

  async createLead(dto: import('./dto/create-lead.dto').CreateLeadDto, refCookie: string | null) {
    const departure = await this.tenantPrisma.client.packageDeparture.findUnique({
      where: { id: dto.departureId },
      include: { package: true }
    });

    if (!departure || departure.package.status !== 'published') {
      throw new NotFoundException('Jadwal keberangkatan tidak ditemukan atau belum dipublish');
    }
    
    // Normalize today for isPast check (start of today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (departure.departureDate < today) {
      throw new NotFoundException('Jadwal keberangkatan sudah lewat');
    }

    const confirmedCount = await this.tenantPrisma.client.lead.count({
      where: { departureId: dto.departureId, status: 'confirmed' }
    });

    if (confirmedCount >= departure.quota) {
      throw new ConflictException('Tanggal keberangkatan ini sudah penuh (SOLD)');
    }

    const agentId = await this.referralService.resolveAgentFromCookie(refCookie || undefined);

    const lead = await this.tenantPrisma.client.lead.create({
      data: {
        departureId: dto.departureId,
        packageId: departure.packageId,
        name: dto.name,
        phone: dto.phone,
        agentId: agentId,
        status: 'pending'
      }
    });

    return {
      message: 'Booking berhasil dikirim',
      leadId: lead.id,
    };
  }
}
