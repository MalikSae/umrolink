import { loginAsAdmin } from './helpers/auth-helper';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';

describe('Commission (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  let tenantA: any;
  let tenantB: any;
  let pkg1: any;
  let pkgNoComm: any;
  let departure1: any;
  let departureNoComm: any;
  let agent: any;
  let adminToken: string;
  let adminTokenB: string;
  let agentToken: string;
  const rootDomain = process.env.TENANT_ROOT_DOMAIN || 'umrolink.test';

  beforeAll(async () => {
    const rootDomain = process.env.TENANT_ROOT_DOMAIN || 'umrolink.test';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = new PrismaClient();

    // Clean up ONLY our own test tenants (tenanta/tenantb), preserve seed tenants (barokah/hijaz)
    const testTenants = await prisma.tenant.findMany({
      where: { subdomain: { in: ['commtenanta', 'commtenantb'] } }
    });
    const testTenantIds = testTenants.map(t => t.id);

    if (testTenantIds.length > 0) {
      await prisma.commission.deleteMany({ where: { tenantId: { in: testTenantIds } } });
      await prisma.leadRoomAllocation.deleteMany({ where: { tenantId: { in: testTenantIds } } });
      await prisma.lead.deleteMany({ where: { tenantId: { in: testTenantIds } } });
      await prisma.packageDeparture.deleteMany({ where: { tenantId: { in: testTenantIds } } });
      await prisma.package.deleteMany({ where: { tenantId: { in: testTenantIds } } });
      await prisma.agentProfile.deleteMany({ where: { tenantId: { in: testTenantIds } } });
      await prisma.user.deleteMany({ where: { tenantId: { in: testTenantIds } } });
      await prisma.banner.deleteMany({ where: { tenantId: { in: testTenantIds } } });
      await prisma.tenant.deleteMany({ where: { id: { in: testTenantIds } } });
    }

    tenantA = await prisma.tenant.create({ data: { name: 'Comm Tenant A', subdomain: 'commtenanta' } });
    tenantB = await prisma.tenant.create({ data: { name: 'Comm Tenant B', subdomain: 'commtenantb' } });

    const passwordHash = await argon2.hash('Password123!');
    const admin = await prisma.user.create({ data: { email: 'admin@commtenanta.umrolink.test', passwordHash, name: 'Admin A', role: 'travel_admin', tenantId: tenantA.id } });
    adminToken = await loginAsAdmin(app, tenantA.subdomain, admin.email, 'Password123!', rootDomain);

    const adminBUser = await prisma.user.create({ data: { email: 'admin@commtenantb.umrolink.test', passwordHash, name: 'Admin B', role: 'travel_admin', tenantId: tenantB.id } });
    adminTokenB = await loginAsAdmin(app, tenantB.subdomain, adminBUser.email, 'Password123!', rootDomain);

    agent = await prisma.user.create({
      data: {
        email: 'agent@commtenanta.umrolink.test', passwordHash, name: 'Agent A', role: 'agent', tenantId: tenantA.id,
        agentProfile: { create: { tenantId: tenantA.id, phone: '123', city: 'city', status: 'active', agentCode: 'AGT001' } }
      },
      include: { agentProfile: true }
    });
    agentToken = jwt.sign({ sub: agent.id, email: agent.email, role: agent.role, tenantId: agent.tenantId, agentProfileId: agent.agentProfile.id }, process.env.JWT_SECRET || 'secret');

    pkg1 = await prisma.package.create({ data: { tenantId: tenantA.id, name: 'Package 1', slug: 'package-1', status: 'published', agentCommission: 1500000 } });
    pkgNoComm = await prisma.package.create({ data: { tenantId: tenantA.id, name: 'Package No Comm', slug: 'package-no-comm', status: 'published' } });

    departure1 = await prisma.packageDeparture.create({ data: { tenantId: tenantA.id, packageId: pkg1.id, departureDate: new Date(Date.now() + 86400000 * 30), quota: 10 } });
    departureNoComm = await prisma.packageDeparture.create({ data: { tenantId: tenantA.id, packageId: pkgNoComm.id, departureDate: new Date(Date.now() + 86400000 * 30), quota: 10 } });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  let organicLeadId: string;
  let agentLeadId: string;
  let noCommLeadId: string;
  let pendingCommissionId: string;

  beforeAll(async () => {
    const l1 = await prisma.lead.create({ data: { tenantId: tenantA.id, packageId: pkg1.id, departureId: departure1.id, name: 'L1', phone: '111', status: 'pending', totalJamaah: 1 } });
    organicLeadId = l1.id;
    const l2 = await prisma.lead.create({ data: { tenantId: tenantA.id, packageId: pkg1.id, departureId: departure1.id, name: 'L2', phone: '222', status: 'pending', agentId: agent.agentProfile.id, totalJamaah: 1 } });
    agentLeadId = l2.id;
    const l3 = await prisma.lead.create({ data: { tenantId: tenantA.id, packageId: pkgNoComm.id, departureId: departureNoComm.id, name: 'L3', phone: '333', status: 'pending', agentId: agent.agentProfile.id, totalJamaah: 1 } });
    noCommLeadId = l3.id;
  });

  it('1. mark-dp-received lead DENGAN agentId, package.agentCommission terisi -> Commission ter-buat otomatis, status pending, amount SESUAI (totalJamaah=1)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/leads/${agentLeadId}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(200);

    const comm = await prisma.commission.findUnique({ where: { leadId: agentLeadId } });
    expect(comm).toBeDefined();
    expect(comm?.status).toBe('pending');
    // totalJamaah=1, agentCommission=1500000 -> amount = 1500000 * 1 = 1500000
    expect(comm?.amount).toBe(1500000);
    pendingCommissionId = comm!.id;
  });

  it('2. mark-dp-received lead TANPA agentId (organik) -> TIDAK ADA Commission ter-buat', async () => {
    await request(app.getHttpServer())
      .patch(`/api/leads/${organicLeadId}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(200);

    const comm = await prisma.commission.findUnique({ where: { leadId: organicLeadId } });
    expect(comm).toBeNull();
  });

  it('3. mark-dp-received lead dengan agentId TAPI package.agentCommission NULL -> TIDAK ADA Commission ter-buat', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/leads/${noCommLeadId}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(200);

    expect(res.body.warning).toBe('Paket tidak memiliki konfigurasi komisi agen');

    const comm = await prisma.commission.findUnique({ where: { leadId: noCommLeadId } });
    expect(comm).toBeNull();
  });

  it('4. Cancel lead yang Commission-nya masih pending -> Commission ikut jadi cancelled', async () => {
    const l4 = await prisma.lead.create({ data: { tenantId: tenantA.id, packageId: pkg1.id, departureId: departure1.id, name: 'L4', phone: '444', status: 'pending', agentId: agent.agentProfile.id, totalJamaah: 1 } });
    await request(app.getHttpServer())
      .patch(`/api/leads/${l4.id}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/leads/${l4.id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(200);

    const comm = await prisma.commission.findUnique({ where: { leadId: l4.id } });
    expect(comm?.status).toBe('cancelled');
  });

  it('5. Cancel lead yang Commission-nya SUDAH paid -> Commission TETAP paid (tidak berubah), response ada field warning', async () => {
    const l5 = await prisma.lead.create({ data: { tenantId: tenantA.id, packageId: pkg1.id, departureId: departure1.id, name: 'L5', phone: '555', status: 'pending', agentId: agent.agentProfile.id, totalJamaah: 1 } });
    await request(app.getHttpServer())
      .patch(`/api/leads/${l5.id}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test');

    const comm = await prisma.commission.findUnique({ where: { leadId: l5.id } });
    await prisma.commission.update({ where: { id: comm!.id }, data: { status: 'paid', paidAt: new Date() } });

    const res = await request(app.getHttpServer())
      .patch(`/api/leads/${l5.id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(200);

    expect(res.body.warning).toBe('Booking dibatalkan tapi komisi sudah terlanjur dibayar — perlu ditangani manual');
    const commAfter = await prisma.commission.findUnique({ where: { leadId: l5.id } });
    expect(commAfter?.status).toBe('paid');
  });

  it('6. PATCH /api/commissions/:id/mark-payable dari status pending -> 200, jadi payable', async () => {
    await request(app.getHttpServer())
      .patch(`/api/commissions/${pendingCommissionId}/mark-payable`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(200);

    const comm = await prisma.commission.findUnique({ where: { id: pendingCommissionId } });
    expect(comm?.status).toBe('payable');
  });

  it('7. PATCH /api/commissions/:id/mark-payable dari status BUKAN pending (misal sudah payable) -> 400', async () => {
    await request(app.getHttpServer())
      .patch(`/api/commissions/${pendingCommissionId}/mark-payable`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(400);
  });

  it('8. PATCH /api/commissions/:id/mark-paid dari status payable -> 200, jadi paid, paidAt terisi', async () => {
    await request(app.getHttpServer())
      .patch(`/api/commissions/${pendingCommissionId}/mark-paid`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(200);

    const comm = await prisma.commission.findUnique({ where: { id: pendingCommissionId } });
    expect(comm?.status).toBe('paid');
    expect(comm?.paidAt).not.toBeNull();
  });

  it('9. PATCH /api/commissions/:id/mark-paid dari status BUKAN payable -> 400', async () => {
    await request(app.getHttpServer())
      .patch(`/api/commissions/${pendingCommissionId}/mark-paid`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(400);
  });

  it('10. GET /api/commissions sebagai travel_admin -> lihat semua komisi tenant', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/commissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('11. GET /api/agent/commissions sebagai agent A -> HANYA lihat komisi milik sendiri, TIDAK lihat komisi agent lain di tenant yang sama', async () => {
    const agent2 = await prisma.user.create({
      data: {
        email: 'agent2@commtenanta.umrolink.test', passwordHash: '123', name: 'Agent 2', role: 'agent', tenantId: tenantA.id,
        agentProfile: { create: { tenantId: tenantA.id, phone: '123', city: 'city', status: 'active', agentCode: 'AGT003' } }
      },
      include: { agentProfile: true }
    });

    const l6 = await prisma.lead.create({ data: { tenantId: tenantA.id, packageId: pkg1.id, departureId: departure1.id, name: 'L6', phone: '666', status: 'pending', agentId: agent2.agentProfile!.id, totalJamaah: 1 } });
    await request(app.getHttpServer())
      .patch(`/api/leads/${l6.id}/mark-dp-received`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/api/agent/commissions`)
      .set('Authorization', `Bearer ${agentToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(200);

    expect(res.body).toHaveProperty('commissions');
    expect(res.body.commissions.every((c: any) => c.agentId === agent.agentProfile.id)).toBe(true);
  });

  it('12. GET /api/agent/commissions sebagai role travel_admin -> 403 (endpoint ini khusus agent)', async () => {
    await request(app.getHttpServer())
      .get(`/api/agent/commissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'commtenanta.umrolink.test')
      .expect(403);
  });

  it('13. Cross-tenant: travel_admin Hijaz coba mark-paid komisi milik Barokah -> 404', async () => {
    await request(app.getHttpServer())
      .patch(`/api/commissions/${pendingCommissionId}/mark-paid`)
      .set('Authorization', `Bearer ${adminTokenB}`)
      .set('Host', 'commtenantb.umrolink.test')
      .expect(404);
  });
});
