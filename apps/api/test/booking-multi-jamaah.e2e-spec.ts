import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';

/**
 * Test suite: Booking Multi-Jamaah (Sprint 10)
 *
 * Skenario utama:
 * 1. SUM(totalJamaah) bukan COUNT(lead) — kuota dihitung dari jumlah jamaah, bukan baris
 * 2. Race condition dengan SUM — SERIALIZABLE transaction mencegah overbooking
 * 3. Komisi dikali totalJamaah (bukan flat per booking)
 * 4. mark-paid-full untuk lead pending langsung → jalur konfirmasi pertama (cek kuota)
 * 5. mark-paid-full untuk lead sudah confirmed → hanya update paymentStatus, tidak cek kuota
 *
 * Semua Lead dibuat langsung lewat Prisma (bypass API form booking yang belum ada).
 * Subdomain unik: multijamaahtenant (berbeda dari file test lain)
 */
describe('Booking Multi-Jamaah (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  let tenant: any;
  let pkg: any;
  let agentProfile: any;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = new PrismaClient();

    // Cleanup tenant unik untuk file ini
    const existing = await prisma.tenant.findMany({
      where: { subdomain: { in: ['multijamaahtenant'] } }
    });
    const existingIds = existing.map(t => t.id);

    if (existingIds.length > 0) {
      await prisma.commission.deleteMany({ where: { tenantId: { in: existingIds } } });
      await prisma.leadRoomAllocation.deleteMany({ where: { tenantId: { in: existingIds } } });
      await prisma.lead.deleteMany({ where: { tenantId: { in: existingIds } } });
      await prisma.packageDeparture.deleteMany({ where: { tenantId: { in: existingIds } } });
      await prisma.package.deleteMany({ where: { tenantId: { in: existingIds } } });
      await prisma.agentProfile.deleteMany({ where: { tenantId: { in: existingIds } } });
      await prisma.user.deleteMany({ where: { tenantId: { in: existingIds } } });
      await prisma.banner.deleteMany({ where: { tenantId: { in: existingIds } } });
      await prisma.tenant.deleteMany({ where: { id: { in: existingIds } } });
    }

    // Buat tenant, admin, agen, paket
    tenant = await prisma.tenant.create({
      data: { name: 'Multi Jamaah Tenant', subdomain: 'multijamaahtenant' }
    });

    const passwordHash = await argon2.hash('Password123!');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@multijamaahtenant.test',
        passwordHash,
        name: 'Admin MJ',
        role: 'travel_admin',
        tenantId: tenant.id
      }
    });

    adminToken = jwt.sign(
      { sub: admin.id, email: admin.email, role: admin.role, tenantId: admin.tenantId },
      process.env.JWT_SECRET || 'secret'
    );

    const agentUser = await prisma.user.create({
      data: {
        email: 'agent@multijamaahtenant.test',
        passwordHash,
        name: 'Agent MJ',
        role: 'agent',
        tenantId: tenant.id,
        agentProfile: {
          create: {
            tenantId: tenant.id,
            phone: '0812345',
            city: 'Jakarta',
            status: 'active',
            agentCode: 'MJT001'
          }
        }
      },
      include: { agentProfile: true }
    });
    agentProfile = agentUser.agentProfile;

    pkg = await prisma.package.create({
      data: {
        tenantId: tenant.id,
        name: 'Paket Multi Test',
        slug: 'paket-multi-test',
        status: 'published',
        agentCommission: 1000000, // 1jt per jamaah
        priceQuad: 28000000,
        priceTriple: 30000000,
        priceDouble: 32000000,
      }
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // Helper: buat departure dengan kuota tertentu
  async function createDeparture(quota: number) {
    return prisma.packageDeparture.create({
      data: {
        tenantId: tenant.id,
        packageId: pkg.id,
        departureDate: new Date(Date.now() + 86400000 * 60),
        quota
      }
    });
  }

  // Helper: buat lead langsung lewat Prisma (bypass form API)
  async function createLead(departureId: string, totalJamaah: number, agentId?: string) {
    return prisma.lead.create({
      data: {
        tenantId: tenant.id,
        packageId: pkg.id,
        departureId,
        name: `Test Lead ${Date.now()}-${Math.random()}`,
        phone: `0812${Date.now()}`.slice(0, 13),
        status: 'pending',
        totalJamaah,
        type: 'booking',
        agentId: agentId ?? null
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // Skenario 1: totalJamaah=6 pada departure quota=10 → berhasil, sisa 4
  // ─────────────────────────────────────────────────────────────────────
  it('1. totalJamaah=6, departure quota=10 -> mark-dp-received 200, confirmedJamaah sekarang 6', async () => {
    const dep = await createDeparture(10);
    const lead = await createLead(dep.id, 6);

    const res = await request(app.getHttpServer())
      .patch(`/api/leads/${lead.id}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'multijamaahtenant.umrolink.test')
      .expect(200);

    expect(res.body.status).toBe('confirmed');
    expect(res.body.paymentStatus).toBe('dp_received');

    // Verifikasi DB: confirmedJamaah sekarang 6 (SUM, bukan COUNT=1)
    const agg = await prisma.lead.aggregate({
      where: { departureId: dep.id, status: 'confirmed' },
      _sum: { totalJamaah: true }
    });
    expect(agg._sum.totalJamaah).toBe(6);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Skenario 2: totalJamaah=5 di departure yang sudah terisi 6 (quota=10)
  // 6+5=11 > 10 → harus 409 (COUNT lama salah: cuma 2 row, 2 < 10 lolos)
  // ─────────────────────────────────────────────────────────────────────
  it('2. totalJamaah=5 di departure confirmedJamaah=6 (quota=10) -> 409 karena 6+5=11>10', async () => {
    // Buat departure baru, isi 6 jamaah terlebih dulu
    const dep = await createDeparture(10);
    const leadA = await createLead(dep.id, 6);
    await request(app.getHttpServer())
      .patch(`/api/leads/${leadA.id}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'multijamaahtenant.umrolink.test')
      .expect(200);

    // Sekarang coba tambah 5 jamaah lagi (total jadi 11 > 10)
    const leadB = await createLead(dep.id, 5);

    const res = await request(app.getHttpServer())
      .patch(`/api/leads/${leadB.id}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'multijamaahtenant.umrolink.test')
      .expect(409);

    expect(res.body.message).toContain('Kuota tanggal keberangkatan ini tidak cukup');

    // DB: masih cuma 6 jamaah confirmed, bukan 11 (tidak ada overbooking)
    const agg = await prisma.lead.aggregate({
      where: { departureId: dep.id, status: 'confirmed' },
      _sum: { totalJamaah: true }
    });
    expect(agg._sum.totalJamaah).toBe(6);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Skenario 3: totalJamaah=4 di departure confirmedJamaah=6 (quota=10)
  // 6+4=10 (pas) → harus berhasil (200)
  // ─────────────────────────────────────────────────────────────────────
  it('3. totalJamaah=4 di departure confirmedJamaah=6 (quota=10) -> 200 karena 6+4=10 (pas)', async () => {
    const dep = await createDeparture(10);

    // Isi 6 jamaah dulu
    const leadA = await createLead(dep.id, 6);
    await request(app.getHttpServer())
      .patch(`/api/leads/${leadA.id}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'multijamaahtenant.umrolink.test')
      .expect(200);

    // Coba tambah 4 (pas kuota)
    const leadB = await createLead(dep.id, 4);
    const res = await request(app.getHttpServer())
      .patch(`/api/leads/${leadB.id}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'multijamaahtenant.umrolink.test')
      .expect(200);

    expect(res.body.status).toBe('confirmed');

    const agg = await prisma.lead.aggregate({
      where: { departureId: dep.id, status: 'confirmed' },
      _sum: { totalJamaah: true }
    });
    expect(agg._sum.totalJamaah).toBe(10); // kuota penuh, tepat
  });

  // ─────────────────────────────────────────────────────────────────────
  // Skenario 4: RACE CONDITION dengan SUM — departure quota=10, confirmed=6 (sisa 4)
  // Lead D (totalJamaah=3) dan Lead E (totalJamaah=3) dikonfirmasi BERSAMAAN
  // HARUS PERSIS SATU yang 200 (3 muat di sisa 4), satunya 409
  // (COUNT lama salah: row D dan E keduanya 1, 1<10 jadi KEDUANYA lolos → overbooking)
  // ─────────────────────────────────────────────────────────────────────
  it('4. RACE CONDITION SUM: dua lead totalJamaah=3 bersamaan, sisa quota=4 -> tepat 1 yang 200, 1 yang 409', async () => {
    const dep = await createDeparture(10);

    // Isi 6 jamaah confirmed dulu (sisa 4)
    const leadBase = await createLead(dep.id, 6);
    await request(app.getHttpServer())
      .patch(`/api/leads/${leadBase.id}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'multijamaahtenant.umrolink.test')
      .expect(200);

    // Verifikasi state awal: confirmed=6, sisa=4
    const aggBefore = await prisma.lead.aggregate({
      where: { departureId: dep.id, status: 'confirmed' },
      _sum: { totalJamaah: true }
    });
    expect(aggBefore._sum.totalJamaah).toBe(6);

    // Buat dua lead masing-masing 3 jamaah
    const leadD = await createLead(dep.id, 3);
    const leadE = await createLead(dep.id, 3);

    // Konfirmasi bersamaan via Promise.all
    const [resD, resE] = await Promise.all([
      request(app.getHttpServer())
        .patch(`/api/leads/${leadD.id}/mark-dp-received`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Host', 'multijamaahtenant.umrolink.test')
        .send(),
      request(app.getHttpServer())
        .patch(`/api/leads/${leadE.id}/mark-dp-received`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Host', 'multijamaahtenant.umrolink.test')
        .send()
    ]);

    const statuses = [resD.status, resE.status];
    console.log(`Race condition statuses: [${statuses.join(', ')}]`);

    // TEPAT SATU yang 200, satunya HARUS 409 (bukan 500, bukan keduanya 200)
    expect(statuses.filter(s => s === 200).length).toBe(1);
    expect(statuses.filter(s => s === 409).length).toBe(1);

    // DB: confirmedJamaah sekarang 9 (6+3=9), bukan 12 (overbooking)
    const aggAfter = await prisma.lead.aggregate({
      where: { departureId: dep.id, status: 'confirmed' },
      _sum: { totalJamaah: true }
    });
    expect(aggAfter._sum.totalJamaah).toBe(9);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Skenario 5: Komisi dikali totalJamaah
  // agentCommission=1000000, totalJamaah=4 → Commission.amount harus 4000000
  // ─────────────────────────────────────────────────────────────────────
  it('5. Komisi: totalJamaah=4, agentCommission=1000000 -> Commission.amount=4000000', async () => {
    const dep = await createDeparture(20);
    const lead = await createLead(dep.id, 4, agentProfile.id);

    await request(app.getHttpServer())
      .patch(`/api/leads/${lead.id}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'multijamaahtenant.umrolink.test')
      .expect(200);

    const comm = await prisma.commission.findUnique({ where: { leadId: lead.id } });
    expect(comm).toBeDefined();
    expect(comm?.amount).toBe(4000000); // 1000000 x 4 jamaah
    expect(comm?.status).toBe('pending');
  });

  // ─────────────────────────────────────────────────────────────────────
  // Skenario 6: mark-paid-full untuk lead PENDING (belum pernah DP)
  // → jalur cek kuota lalu confirm, paymentStatus langsung 'paid_full'
  // ─────────────────────────────────────────────────────────────────────
  it('6. mark-paid-full untuk lead pending (belum pernah DP) -> 200, langsung confirmed + paid_full', async () => {
    const dep = await createDeparture(10);
    const lead = await createLead(dep.id, 3);

    const res = await request(app.getHttpServer())
      .patch(`/api/leads/${lead.id}/mark-paid-full`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'multijamaahtenant.umrolink.test')
      .expect(200);

    expect(res.body.status).toBe('confirmed');
    expect(res.body.paymentStatus).toBe('paid_full');

    const updated = await prisma.lead.findUnique({ where: { id: lead.id } });
    expect(updated?.status).toBe('confirmed');
    expect(updated?.paymentStatus).toBe('paid_full');
    expect(updated?.confirmedAt).not.toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Skenario 7: mark-paid-full untuk lead yang SUDAH confirmed dari mark-dp-received
  // → hanya update paymentStatus, TIDAK cek kuota ulang → 200
  // ─────────────────────────────────────────────────────────────────────
  it('7. mark-paid-full untuk lead yang sudah confirmed (dari DP) -> 200, hanya update paymentStatus, tidak cek kuota ulang', async () => {
    const dep = await createDeparture(5);
    const lead = await createLead(dep.id, 5);

    // DP dulu (mengisi semua kuota)
    await request(app.getHttpServer())
      .patch(`/api/leads/${lead.id}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'multijamaahtenant.umrolink.test')
      .expect(200);

    // Verifikasi kuota sudah penuh
    const agg = await prisma.lead.aggregate({
      where: { departureId: dep.id, status: 'confirmed' },
      _sum: { totalJamaah: true }
    });
    expect(agg._sum.totalJamaah).toBe(5); // kuota penuh

    // mark-paid-full tidak cek kuota ulang (sudah confirmed), harus 200
    const res = await request(app.getHttpServer())
      .patch(`/api/leads/${lead.id}/mark-paid-full`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'multijamaahtenant.umrolink.test')
      .expect(200);

    expect(res.body.paymentStatus).toBe('paid_full');
    expect(res.body.status).toBe('confirmed'); // status tidak berubah, tetap confirmed
  });
});
