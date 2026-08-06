import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Package (e2e)', () => {
  let app: INestApplication;
  let barokahToken = '';
  let hijazToken = '';
  let agentToken = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    const rootD = process.env.TENANT_ROOT_DOMAIN || 'localhost';

    // Login travel_admin Barokah
    const resA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', `barokah.${rootD}`)
      .send({ email: 'admin@barokah.test', password: 'Password123!' });
    barokahToken = resA.body?.access_token || '';

    // Login agent Barokah
    const resAgent = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', `barokah.${rootD}`)
      .send({ email: 'agent@barokah.test', password: 'Password123!' });
    agentToken = resAgent.body?.access_token || '';

    // Login travel_admin Hijaz
    const resB = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', `hijaz.${rootD}`)
      .send({ email: 'admin@hijaz.test', password: 'Password123!' });
    hijazToken = resB.body?.access_token || '';
  });

  afterAll(async () => {
    await app.close();
  });

  const rootDomain = process.env.TENANT_ROOT_DOMAIN || 'localhost';

  let draftPackageId = '';

  it('1. Create package dengan role travel_admin -> Sukses 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/packages')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({
        name: 'Paket Umrah Promo',
        description: '<p>Paket murah meriah</p>',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Paket Umrah Promo');
    expect(res.body.status).toBe('draft');
    expect(res.body.tenantId).toBeDefined();
    draftPackageId = res.body.id;
  });

  it('2. Create package dengan role agent -> Gagal 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/packages')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        name: 'Paket Unauthorized',
      });

    expect(res.status).toBe(403);
  });

  it('3. GET list package dengan tenant Hijaz -> Tidak menampilkan package Barokah', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/packages')
      .set('Host', `hijaz.${rootDomain}`)
      .set('Authorization', `Bearer ${hijazToken}`);

    expect(res.status).toBe(200);
    const names = res.body.data.map((p: { name: string }) => p.name);
    expect(names).not.toContain('Paket Umrah Promo');
  });

  it('3b. GET list package dengan tenant Barokah -> Menampilkan package Barokah', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/packages')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);

    expect(res.status).toBe(200);
    const names = res.body.data.map((p: { name: string }) => p.name);
    expect(names).toContain('Paket Umrah Promo');
  });

  it('3c. GET list package tanpa token -> Gagal 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/packages')
      .set('Host', `barokah.${rootDomain}`);

    expect(res.status).toBe(401);
  });

  // --- Publish validation: aturan baru (OR logic, minimal 1 harga) ---

  it('4. Publish package dengan SEMUA harga kosong -> Gagal 400', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/packages/${draftPackageId}/publish`)
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('semua harga masih kosong');
  });

  it('5. Update status menjadi published via DTO dengan semua harga kosong -> Gagal 400', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/packages/${draftPackageId}`)
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({ status: 'published' });

    expect(res.status).toBe(400);
  });

  it('6. Publish dengan HANYA priceQuad terisi (triple/double kosong) -> Sukses 200 (aturan baru OR)', async () => {
    // Set hanya priceQuad, triple dan double kosong
    await request(app.getHttpServer())
      .patch(`/api/packages/${draftPackageId}`)
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({ priceQuad: 20000000 });

    const res = await request(app.getHttpServer())
      .patch(`/api/packages/${draftPackageId}/publish`)
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');
  });

  it('6b. Publish dengan ketiga harga terisi -> Sukses 200 (regresi)', async () => {
    // Buat paket baru dan set ketiga harga
    const createRes = await request(app.getHttpServer())
      .post('/api/packages')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({ name: 'Paket Regresi Tiga Harga' });

    const pkgId = createRes.body.id;

    await request(app.getHttpServer())
      .patch(`/api/packages/${pkgId}`)
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({ priceQuad: 20000000, priceTriple: 22000000, priceDouble: 24000000 });

    const res = await request(app.getHttpServer())
      .patch(`/api/packages/${pkgId}/publish`)
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');

    // Cleanup
    await request(app.getHttpServer())
      .delete(`/api/packages/${pkgId}`)
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);
  });

  // --- Departure dates ---

  let pkgWithDeparturesId = '';

  it('7. Create package dengan 2 departure dates -> Tersimpan, GET detail menunjukkan keduanya', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/packages')
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({
        name: 'Paket Dengan Keberangkatan',
        priceQuad: 20000000,
        departures: [
          { departureDate: '2026-11-01', quota: 30 },
          { departureDate: '2026-12-01', quota: 25 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.departures).toHaveLength(2);
    expect(res.body.departures[0].quota).toBe(30);
    expect(res.body.departures[1].quota).toBe(25);
    pkgWithDeparturesId = res.body.id;
  });

  it('8. Update package — ganti 2 departure menjadi 1 tanggal berbeda -> Departure lama terhapus', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/packages/${pkgWithDeparturesId}`)
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`)
      .send({
        departures: [
          { departureDate: '2027-03-15', quota: 40 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.departures).toHaveLength(1);
    expect(res.body.departures[0].quota).toBe(40);
    // Pastikan tanggal lama tidak ada lagi
    const dates = res.body.departures.map((d: { departureDate: string }) => d.departureDate.split('T')[0]);
    expect(dates).not.toContain('2026-11-01');
    expect(dates).not.toContain('2026-12-01');
    expect(dates).toContain('2027-03-15');
  });

  it('9. Update package lintas tenant (Hijaz update package Barokah) -> Gagal 404', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/packages/${pkgWithDeparturesId}`)
      .set('Host', `hijaz.${rootDomain}`)
      .set('Authorization', `Bearer ${hijazToken}`)
      .send({ name: 'Hacked by Hijaz' });

    expect(res.status).toBe(404);
  });

  it('10. Delete package (travel_admin) -> Sukses 200, departure ikut terhapus (cascade)', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/packages/${draftPackageId}`)
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);

    expect(res.status).toBe(200);

    const check = await request(app.getHttpServer())
      .get(`/api/packages/${draftPackageId}`)
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);

    expect(check.status).toBe(404);

    // Cleanup paket dengan departures
    await request(app.getHttpServer())
      .delete(`/api/packages/${pkgWithDeparturesId}`)
      .set('Host', `barokah.${rootDomain}`)
      .set('Authorization', `Bearer ${barokahToken}`);
  });
});
