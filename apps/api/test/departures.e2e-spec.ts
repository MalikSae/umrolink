import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('Departures (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let barokahToken = '';
  let hijazToken = '';
  let agentToken = '';
  
  let barokahPackageId = '';
  let hijazPackageId = '';
  
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
    const resA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', `barokah.${rootDomain}`)
      .send({ email: 'admin@barokah.test', password: 'Password123!' });
    barokahToken = resA.body?.access_token || '';

    // Login agent Barokah
    const resAgent = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', `barokah.${rootDomain}`)
      .send({ email: 'agent@barokah.test', password: 'Password123!' });
    agentToken = resAgent.body?.access_token || '';

    // Login travel_admin Hijaz
    const resB = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', `hijaz.${rootDomain}`)
      .send({ email: 'admin@hijaz.test', password: 'Password123!' });
    hijazToken = resB.body?.access_token || '';
    
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
  });

  afterAll(async () => {
    // Cleanup
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

  it('1. Create departure dengan role agent -> Gagal 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/departures')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        packageId: barokahPackageId,
        departureDate: '2030-01-01',
        quota: 10,
      });

    expect(res.status).toBe(403);
  });

  it('2. Create departure dengan tanggal masa lalu -> Gagal 400', async () => {
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

  it('3. Create departure untuk package tenant lain -> Gagal 404', async () => {
    // Barokah admin mencoba menambah keberangkatan ke paket Hijaz
    const res = await request(app.getHttpServer())
      .post('/api/departures')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({
        packageId: hijazPackageId,
        departureDate: '2030-01-01',
        quota: 10,
      });

    expect(res.status).toBe(404);
  });

  let validDepartureId = '';

  it('4. Create departure valid -> Sukses 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/departures')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({
        packageId: barokahPackageId,
        departureDate: '2030-12-31',
        quota: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.packageId).toBe(barokahPackageId);
    expect(res.body.quota).toBe(10);
    validDepartureId = res.body.id;
  });

  it('5. GET departures tenant isolation -> Hijaz tidak melihat departure Barokah', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/departures')
      .set('Host', `hijaz.${rootDomain}`)
      .set('Authorization', `Bearer ${hijazToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((d: any) => d.id);
    expect(ids).not.toContain(validDepartureId);
  });

  it('6. GET departures -> kalkulasi confirmedCount, remaining, status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/departures')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);

    expect(res.status).toBe(200);
    const dep = res.body.data.find((d: any) => d.id === validDepartureId);
    expect(dep).toBeDefined();
    expect(dep.confirmedCount).toBe(0); // Belum ada lead
    expect(dep.remaining).toBe(10);
    expect(dep.status).toBe('available');
    expect(dep.package.name).toBe('Paket Barokah');
  });

  it('7. GET departures filter status -> valid filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/departures?status=past')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);

    expect(res.status).toBe(200);
    const dep = res.body.data.find((d: any) => d.id === validDepartureId);
    expect(dep).toBeUndefined(); // Karena statusnya available, tidak muncul di filter past
  });
});
