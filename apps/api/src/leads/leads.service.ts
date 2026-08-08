import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
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
    return this.tenantPrisma.client.lead.findMany({
      include: {
        package: { select: { name: true, slug: true } },
        departure: { select: { departureDate: true } },
        agent: { select: { user: { select: { name: true } } } },
        roomAllocations: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Shared logic untuk mark-dp-received dan mark-paid-full.
   *
   * Jika lead masih 'pending' (pertama kali menerima pembayaran):
   *   - Cek dan kunci kuota via SERIALIZABLE transaction (SUM totalJamaah)
   *   - Set status = 'confirmed', paymentStatus = targetPaymentStatus
   *   - Buat komisi otomatis jika ada agentId (amount = agentCommission * totalJamaah)
   *
   * Jika lead sudah 'confirmed' sebelumnya (naik dari DP ke lunas):
   *   - Tidak cek kuota ulang
   *   - Hanya update paymentStatus
   */
  async markPayment(id: string, targetPaymentStatus: 'dp_received' | 'paid_full') {
    try {
      return await this.tenantPrisma.client.$transaction(async (tx) => {
        const lead = await tx.lead.findFirst({
          where: { id },
          include: { departure: true }
        });

        if (!lead) throw new NotFoundException('Lead tidak ditemukan');
        if (lead.status === 'cancelled') {
          throw new BadRequestException('Booking ini sudah dibatalkan');
        }
        if (lead.type !== 'booking' || !lead.departureId) {
          throw new BadRequestException('Ini masih prospek, belum punya tanggal keberangkatan');
        }

        if (lead.status === 'pending') {
          // Pertama kali dikonfirmasi — cek kuota dengan SUM(totalJamaah) SERIALIZABLE
          const agg = await tx.lead.aggregate({
            where: { departureId: lead.departureId, status: 'confirmed' },
            _sum: { totalJamaah: true }
          });
          const confirmedJamaah = agg._sum.totalJamaah ?? 0;

          if (confirmedJamaah + lead.totalJamaah > lead.departure!.quota) {
            throw new ConflictException('Kuota tanggal keberangkatan ini tidak cukup untuk jumlah jamaah booking ini');
          }

          await tx.lead.update({
            where: { id },
            data: {
              status: 'confirmed',
              confirmedAt: new Date(),
              paymentStatus: targetPaymentStatus
            }
          });

          let warning: string | undefined;

          // Auto-buat komisi — dikali totalJamaah (bukan flat per booking)
          if (lead.agentId) {
            const pkg = await tx.package.findFirst({ where: { id: lead.packageId } });
            if (!pkg?.agentCommission || pkg.agentCommission <= 0) {
              warning = 'Paket tidak memiliki konfigurasi komisi agen';
            } else {
              await tx.commission.create({
                data: {
                  leadId: lead.id,
                  agentId: lead.agentId,
                  amount: pkg.agentCommission * lead.totalJamaah,
                  status: 'pending'
                }
              });
            }
          }

          const updatedLead = await tx.lead.findFirst({
            where: { id },
            include: { roomAllocations: true }
          });

          return warning ? { ...updatedLead, warning } : updatedLead;
        } else {
          // Sudah confirmed sebelumnya (misal DP → lunas) — hanya update paymentStatus, TIDAK cek kuota
          await tx.lead.update({
            where: { id },
            data: { paymentStatus: targetPaymentStatus }
          });

          return tx.lead.findFirst({
            where: { id },
            include: { roomAllocations: true }
          });
        }
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      });
    } catch (err) {
      // P2034 = Transaction failed due to write conflict/deadlock (MySQL SERIALIZABLE)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
        throw new ConflictException('Kuota tanggal keberangkatan ini tidak cukup untuk jumlah jamaah booking ini');
      }
      throw err; // re-throw semua error lain (termasuk ConflictException, BadRequestException, NotFoundException dari dalam tx)
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
