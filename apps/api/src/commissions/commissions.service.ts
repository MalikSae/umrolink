import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { CommissionStatus } from '@prisma/client';

@Injectable()
export class CommissionsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async findAll(status?: CommissionStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.tenantPrisma.client.commission.findMany({
      where,
      include: {
        lead: { select: { name: true } },
        agent: { select: { user: { select: { name: true } }, agentCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markPayable(id: string) {
    const commission = await this.tenantPrisma.client.commission.findFirst({
      where: { id }
    });

    if (!commission) throw new NotFoundException('Komisi tidak ditemukan');
    if (commission.status !== 'pending') {
      throw new BadRequestException('Komisi ini bukan berstatus pending');
    }

    return this.tenantPrisma.client.commission.update({
      where: { id },
      data: { status: 'payable' }
    });
  }

  async markPaid(id: string) {
    const commission = await this.tenantPrisma.client.commission.findFirst({
      where: { id }
    });

    if (!commission) throw new NotFoundException('Komisi tidak ditemukan');
    if (commission.status !== 'payable') {
      throw new BadRequestException('Komisi ini belum berstatus payable');
    }

    return this.tenantPrisma.client.commission.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date() }
    });
  }

  async findMyCommissions(userId: string) {
    // Cari AgentProfile berdasarkan userId
    const agentProfile = await this.tenantPrisma.client.agentProfile.findFirst({
      where: { userId }
    });

    if (!agentProfile) {
      throw new NotFoundException('Profil agen tidak ditemukan');
    }

    const commissions = await this.tenantPrisma.client.commission.findMany({
      where: { agentId: agentProfile.id },
      include: {
        lead: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalPending = commissions
      .filter(c => c.status === 'pending' || c.status === 'payable')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalPaid = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      commissions,
      totalPending,
      totalPaid
    };
  }
}
