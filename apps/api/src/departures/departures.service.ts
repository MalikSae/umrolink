import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateDepartureDto } from './dto/create-departure.dto';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';

@Injectable()
export class DeparturesService {
  constructor(private readonly prisma: TenantPrismaService) {}

  async findAll(statusFilter?: string) {
    const departures = await this.prisma.client.packageDeparture.findMany({
      include: {
        package: true,
        _count: {
          select: {
            leads: { where: { status: 'confirmed' } }
          }
        }
      },
      orderBy: { departureDate: 'asc' }
    });

    const now = new Date();
    // Reset time to start of day for comparison
    now.setHours(0, 0, 0, 0);

    const enriched = departures.map((dep) => {
      const confirmedCount = dep._count.leads;
      const remaining = Math.max(0, dep.quota - confirmedCount);
      
      let status = 'available';
      const depDate = new Date(dep.departureDate);
      depDate.setHours(0, 0, 0, 0);

      if (depDate < now) {
        status = 'past';
      } else if (confirmedCount >= dep.quota) {
        status = 'sold';
      }

      return {
        ...dep,
        confirmedCount,
        remaining,
        status,
        // Remove _count from output
        _count: undefined,
      };
    });

    if (statusFilter && ['available', 'sold', 'past'].includes(statusFilter)) {
      return enriched.filter(d => d.status === statusFilter);
    }

    return enriched;
  }

  async create(createDepartureDto: CreateDepartureDto) {
    const depDate = new Date(createDepartureDto.departureDate);
    depDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (depDate < now) {
      throw new BadRequestException('Tanggal keberangkatan tidak boleh di masa lalu');
    }

    // Verify package exists and belongs to tenant
    const pkg = await this.prisma.client.package.findFirst({
      where: { id: createDepartureDto.packageId }
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const departure = await this.prisma.client.packageDeparture.create({
      data: {
        packageId: createDepartureDto.packageId,
        departureDate: createDepartureDto.departureDate,
        quota: createDepartureDto.quota,
      },
      include: {
        package: true
      }
    });

    return departure;
  }
}
