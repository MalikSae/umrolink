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
    try {
      return await this.tenantPrisma.client.$transaction(async (tx) => {
        const lead = await tx.lead.findFirst({
          where: { id },
          include: { departure: { include: { package: true } } }
        });

        if (!lead) throw new NotFoundException('Lead tidak ditemukan');
        if (lead.status === 'confirmed') return lead; // already confirmed

        const confirmedCount = await tx.lead.count({
          where: { departureId: lead.departureId, status: 'confirmed' }
        });

        if (confirmedCount >= lead.departure.quota) {
          throw new ConflictException('Kuota keberangkatan sudah penuh');
        }

        const updatedLead = await tx.lead.update({
          where: { id },
          data: {
            status: 'confirmed',
            confirmedAt: new Date()
          }
        });

        let warning: string | undefined;

        if (lead.agentId) {
          const agentCommission = lead.departure.package.agentCommission;
          if (!agentCommission || agentCommission <= 0) {
            warning = 'Paket tidak memiliki konfigurasi komisi agen';
          } else {
            await tx.commission.create({
              data: {
                leadId: lead.id,
                agentId: lead.agentId,
                amount: agentCommission,
                status: 'pending'
              }
            });
          }
        }

        return warning ? { ...updatedLead, warning } : updatedLead;
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      });
    } catch (err) {
      // P2034 = Transaction failed due to a write conflict or deadlock (MySQL SERIALIZABLE)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
        throw new ConflictException('Kuota keberangkatan sudah penuh');
      }
      throw err; // re-throw semua error lain (termasuk ConflictException dari dalam tx)
    }
  }

  async cancel(id: string) {
    return this.tenantPrisma.client.$transaction(async (tx) => {
      const lead = await tx.lead.update({
        where: { id },
        data: {
          status: 'cancelled',
          confirmedAt: null
        }
      });

      const commission = await tx.commission.findFirst({
        where: { leadId: id }
      });

      let warning: string | undefined;

      if (commission) {
        if (commission.status === 'pending' || commission.status === 'payable') {
          await tx.commission.update({
            where: { id: commission.id },
            data: { status: 'cancelled' }
          });
        } else if (commission.status === 'paid') {
          warning = 'Booking dibatalkan tapi komisi sudah terlanjur dibayar — perlu ditangani manual';
        }
      }

      return warning ? { ...lead, warning } : lead;
    });
  }
}
