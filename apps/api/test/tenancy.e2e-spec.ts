import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Tenancy (e2e)', () => {
  let app: INestApplication;

  let barokahToken = '';
  let hijazToken = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    const rootD = process.env.TENANT_ROOT_DOMAIN || 'localhost';
    const resA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', `barokah.${rootD}`)
      .send({ email: 'admin@barokah.test', password: 'Password123!' });
    barokahToken = resA.body?.access_token || '';

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

  it('1. Request dengan Host header barokah -> mengembalikan tenantId Tenant Barokah', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/_internal/tenant-check')
      .set('Host', `barokah.${rootDomain}`);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tenantId');
    expect(res.body.tenantName).toBe('Barokah Tour & Travel');
  });

  it('2. Request dengan Host header domain yang TIDAK terdaftar -> status 404, response body pesan error', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/_internal/tenant-check')
      .set('Host', `tenant-yang-tidak-ada.${rootDomain}`);
    
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tenant tidak ditemukan' });
  });
  it('3. Request dengan Host header root domain (tanpa subdomain) -> status 200, no tenant context', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/_internal/tenant-check')
      .set('Host', rootDomain);
    
    // Status should not be 404 (tenant not found). It could be 200 with an error object
    // indicating no tenant context, as per internal-test.controller.ts logic.
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ error: 'No tenant context' });
  });

});
