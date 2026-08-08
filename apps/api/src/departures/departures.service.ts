import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateDepartureDto } from './dto/create-departure.dto';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';

@Injectable()
export class DeparturesService {
  constructor(private readonly prisma: TenantPrismaService) {}

  async findAll(statusFilter?: string, month?: string, page = 1, limit = 10) {
    const where: any = {};
    
    if (month) {
      const [year, m] = month.split('-');
      const startDate = new Date(parseInt(year, 10), parseInt(m, 10) - 1, 1);
      const endDate = new Date(parseInt(year, 10), parseInt(m, 10), 1);
      where.departureDate = {
        gte: startDate,
        lt: endDate
      };
    }

    const departures = await this.prisma.client.packageDeparture.findMany({
      where,
      include: {
        package: true,
        // Ambil semua lead confirmed beserta totalJamaah untuk SUM di application layer
        leads: {
          where: { status: 'confirmed' },
          select: { totalJamaah: true }
        }
      },
      orderBy: { departureDate: 'asc' }
    });

    const now = new Date();
    // Reset time to start of day for comparison
    now.setHours(0, 0, 0, 0);

    const enriched = departures.map((dep) => {
      // SUM(totalJamaah) dari semua lead confirmed -- menggantikan COUNT(lead) lama
      const confirmedCount = dep.leads.reduce((sum, l) => sum + l.totalJamaah, 0);
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
        // Remove leads array from output (sudah di-aggregate)
        leads: undefined,
      };
    });

    let filtered = enriched;
    if (statusFilter && ['available', 'sold', 'past'].includes(statusFilter)) {
      filtered = enriched.filter(d => d.status === statusFilter);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    };
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
        departureDate: new Date(createDepartureDto.departureDate),
        quota: createDepartureDto.quota,
      },
      include: {
        package: true
      }
    });

    return departure;
  }
}
