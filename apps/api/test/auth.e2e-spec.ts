import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Auth & Role (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let superAdminToken: string;
  let adminAToken: string;
  let agentAToken: string;

  it('1. POST /auth/login dengan kredensial benar di umrolink.test (Super Admin) -> 200', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', 'umrolink.test')
      .send({ email: 'admin@umrolink.com', password: 'Password123!' })
      .expect(201);
    
    expect(res.body.access_token).toBeDefined();
    expect(res.body.user.role).toBe('super_admin');
    superAdminToken = res.body.access_token;
  });

  it('2. POST /auth/login dengan kredensial benar di barokah.umrolink.test (Admin Tenant A) -> 200', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', 'barokah.umrolink.test')
      .send({ email: 'admin@barokah.test', password: 'Password123!' })
      .expect(201);

    expect(res.body.access_token).toBeDefined();
    expect(res.body.user.role).toBe('travel_admin');
    adminAToken = res.body.access_token;
  });

  it('3. POST /auth/login dengan kredensial BENAR (Admin Tenant A) di hijaz.umrolink.test (Tenant B) -> 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', 'hijaz.umrolink.test')
      .send({ email: 'admin@barokah.test', password: 'Password123!' })
      .expect(401);
  });

  it('4. GET /_internal/tenant-check tanpa token -> 200 (karena @Public())', async () => {
    await request(app.getHttpServer())
      .get('/api/_internal/tenant-check')
      .set('Host', 'barokah.umrolink.test')
      .expect(200);
  });

  it('5. GET /auth/me tanpa token -> 401', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Host', 'barokah.umrolink.test')
      .expect(401);
  });

  it('6. GET /auth/me dengan token Super Admin di umrolink.test -> 200', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Host', 'umrolink.test')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);
  });

  it('7. GET /auth/me dengan token Admin Tenant A di barokah.umrolink.test -> 200', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${adminAToken}`)
      .expect(200);
  });

  it('8. GET /auth/me dengan token Admin Tenant A di hijaz.umrolink.test -> 401', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Host', 'hijaz.umrolink.test')
      .set('Authorization', `Bearer ${adminAToken}`)
      .expect(401);
  });

  it('9. GET /auth/me dengan token Agent Tenant A di barokah.umrolink.test -> 200', async () => {
    // We need to login as agent A to get the token
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', 'barokah.umrolink.test')
      .send({ email: 'agent@barokah.test', password: 'Password123!' })
      .expect(201);
    
    agentAToken = res.body.access_token;

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${agentAToken}`)
      .expect(200);
  });

  it('10. POST /packages (admin-only) dengan token Agent Tenant A -> 403', async () => {
    await request(app.getHttpServer())
      .post('/api/packages')
      .set('Host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${agentAToken}`)
      .send({ name: 'Test' })
      .expect(403);
  });

  it('11. POST /packages (admin-only) dengan token Admin Tenant A -> 201', async () => {
    await request(app.getHttpServer())
      .post('/api/packages')
      .set('Host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ name: 'Test', departures: [{ departureDate: '2026-10-10', quota: 40 }] })
      .expect(201);
  });
});
