import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { ClsService } from 'nestjs-cls';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly cls: ClsService
  ) {}

  async findAll() {
    const where: any = {};

    return this.tenantPrisma.client.lead.findMany({
      where,
      include: {
        package: { select: { name: true, slug: true } },
        departure: { select: { departureDate: true } },
        agent: { select: { user: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async confirm(id: string) {
    return this.tenantPrisma.client.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id },
        include: { departure: true }
      });

      if (!lead) throw new NotFoundException('Lead tidak ditemukan');
      if (lead.status === 'confirmed') return lead; // already confirmed

      const confirmedCount = await tx.lead.count({
        where: { departureId: lead.departureId, status: 'confirmed' }
      });

      if (confirmedCount >= lead.departure.quota) {
        throw new ConflictException('Kuota keberangkatan sudah penuh');
      }

      return tx.lead.update({
        where: { id },
        data: {
          status: 'confirmed',
          confirmedAt: new Date()
        }
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
  }

  async cancel(id: string) {
    return this.tenantPrisma.client.lead.update({
      where: { id },
      data: {
        status: 'cancelled',
        confirmedAt: null
      }
    });
  }
}
