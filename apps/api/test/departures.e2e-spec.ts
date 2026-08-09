import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { loginAsAdmin } from './helpers/auth-helper';
import { AppModule } from './../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('Departures (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let barokahToken = '';
  let hijazToken = '';
  let agentToken = '';
  
  let barokahTenantId = '';
  let hijazTenantId = '';
  let barokahPackageId = '';
  let hijazPackageId = '';
  let validDepartureId = '';
  let hijazDepartureId = '';
  
  const rootDomain = process.env.TENANT_ROOT_DOMAIN || 'localhost';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    
    prisma = new PrismaClient();

    // Login travel_admin Barokah
    barokahToken = await loginAsAdmin(app, 'barokah', 'admin@barokah.test', 'Password123!', rootDomain);
    const tb = await prisma.tenant.findUnique({ where: { subdomain: 'barokah' } });
    barokahTenantId = tb?.id || '';

    // Login agent Barokah
    const resAgent = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', `barokah.${rootDomain}`)
      .send({ email: 'agent@barokah.test', password: 'Password123!' });
    agentToken = resAgent.body?.access_token || '';

    // Login travel_admin Hijaz
    hijazToken = await loginAsAdmin(app, 'hijaz', 'admin@hijaz.test', 'Password123!', rootDomain);
    const th = await prisma.tenant.findUnique({ where: { subdomain: 'hijaz' } });
    hijazTenantId = th?.id || '';
    
    // Fallback if tenantId isn't in login payload
    if (!barokahTenantId) {
      const bT = await prisma.tenant.findUnique({ where: { subdomain: 'barokah' } });
      barokahTenantId = bT!.id;
    }
    if (!hijazTenantId) {
      const hT = await prisma.tenant.findUnique({ where: { subdomain: 'hijaz' } });
      hijazTenantId = hT!.id;
    }

    // Create package for barokah
    const pkgA = await request(app.getHttpServer())
      .post('/api/packages')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({ name: 'Paket Barokah', priceQuad: 1000 });
    barokahPackageId = pkgA.body.id;

    // Create package for hijaz
    const pkgB = await request(app.getHttpServer())
      .post('/api/packages')
      .set('Host', `hijaz.${rootDomain}`)
      .set('Authorization', `Bearer ${hijazToken}`)
      .send({ name: 'Paket Hijaz', priceQuad: 2000 });
    hijazPackageId = pkgB.body.id;

    // Create one departure for Barokah
    const depA = await request(app.getHttpServer())
      .post('/api/departures')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({
        packageId: barokahPackageId,
        departureDate: '2030-12-31',
        quota: 10,
      });
    validDepartureId = depA.body.id;

    // Create one departure for Hijaz
    const depB = await request(app.getHttpServer())
      .post('/api/departures')
      .set('Host', `hijaz.${rootDomain}`)
      .set('Authorization', `Bearer ${hijazToken}`)
      .send({
        packageId: hijazPackageId,
        departureDate: '2030-12-31',
        quota: 10,
      });
    hijazDepartureId = depB.body.id;

    // Create leads for Barokah departure to test counts
    await prisma.lead.createMany({
      data: [
        { tenantId: barokahTenantId, packageId: barokahPackageId, departureId: validDepartureId, name: 'Lead 1', phone: '081', status: 'confirmed' },
        { tenantId: barokahTenantId, packageId: barokahPackageId, departureId: validDepartureId, name: 'Lead 2', phone: '082', status: 'confirmed' },
        { tenantId: barokahTenantId, packageId: barokahPackageId, departureId: validDepartureId, name: 'Lead 3', phone: '083', status: 'pending' }, // pending shouldn't count
      ]
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.lead.deleteMany({
      where: {
        packageId: { in: [barokahPackageId, hijazPackageId].filter(Boolean) }
      }
    });

    if (barokahPackageId) {
      await request(app.getHttpServer())
        .delete(`/api/packages/${barokahPackageId}`)
        .set('Host', `barokah.${rootDomain}`)
        .set('Authorization', `Bearer ${barokahToken}`);
    }
    if (hijazPackageId) {
      await request(app.getHttpServer())
        .delete(`/api/packages/${hijazPackageId}`)
        .set('Host', `hijaz.${rootDomain}`)
        .set('Authorization', `Bearer ${hijazToken}`);
    }
    await prisma.$disconnect();
    await app.close();
  });

  it('1. GET /api/departures sebagai travel_admin Barokah -> semua departure Barokah muncul, TIDAK ada milik Hijaz', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/departures?limit=100')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((d: any) => d.id);
    expect(ids).toContain(validDepartureId);
    expect(ids).not.toContain(hijazDepartureId);
  });

  it('2. GET /api/departures -> hitungan confirmedCount/remaining/status BENAR sesuai data Lead yang ada', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/departures?limit=100')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);

    expect(res.status).toBe(200);
    const dep = res.body.data.find((d: any) => d.id === validDepartureId);
    expect(dep).toBeDefined();
    
    // 2 confirmed leads, 1 pending (ignored for confirmedCount)
    expect(dep.confirmedCount).toBe(2); 
    // Quota was 10, remaining should be 8
    expect(dep.remaining).toBe(8);
    // Status available
    expect(dep.status).toBe('available');
  });

  it('3. POST /api/departures dengan packageId valid, tanggal masa depan -> 201, tersimpan', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/departures')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({
        packageId: barokahPackageId,
        departureDate: '2031-01-01',
        quota: 15,
      });

    expect(res.status).toBe(201);
    expect(res.body.packageId).toBe(barokahPackageId);
    expect(res.body.quota).toBe(15);
  });

  it('4. POST /api/departures dengan tanggal MASA LALU -> 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/departures')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({
        packageId: barokahPackageId,
        departureDate: '2020-01-01',
        quota: 10,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('masa lalu');
  });

  it('5. POST /api/departures dengan packageId milik TENANT LAIN -> 404', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/departures')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({
        packageId: hijazPackageId,
        departureDate: '2031-02-01',
        quota: 10,
      });

    expect(res.status).toBe(404);
  });

  it('6. POST /api/departures TIDAK menghapus departure lain milik package yang sama (additive)', async () => {
    // Check initial count
    const resBefore = await request(app.getHttpServer())
      .get('/api/departures?limit=100')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);
      
    const beforeCount = resBefore.body.data.filter((d: any) => d.packageId === barokahPackageId).length;

    // Add new departure
    const resPost = await request(app.getHttpServer())
      .post('/api/departures')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({
        packageId: barokahPackageId,
        departureDate: '2031-03-01',
        quota: 20,
      });
      
    expect(resPost.status).toBe(201);

    // Check new count
    const resAfter = await request(app.getHttpServer())
      .get('/api/departures?limit=100')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);
      
    const afterCount = resAfter.body.data.filter((d: any) => d.packageId === barokahPackageId).length;
    
    expect(afterCount).toBe(beforeCount + 1);
  });

  it('7. GET /api/departures sebagai role agent -> 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/departures?limit=100')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(403);
  });
});
