import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('Auth & Role (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  let handoffCode: string;

  it('1. POST login travel_admin di root -> 201, ada handoff_token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', 'umrolink.test')
      .send({ email: 'admin@barokah.test', password: 'Password123!' })
      .expect(201);
    
    expect(res.body.type).toBe('handoff');
    expect(res.body.handoff_token).toBeDefined();
    expect(res.body.redirectUrl).toBeDefined();
    expect(res.body.redirectUrl).toContain('barokah');
    handoffCode = res.body.handoff_token;
  });

  it('2. GET handoff dengan valid code -> 302 ke /dashboard, Set-Cookie token', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/auth/handoff?code=${handoffCode}`)
      .set('Host', 'barokah.umrolink.test')
      .expect(302);
    
    expect(res.headers.location).toBe('/dashboard');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('umrolink_token=');
  });

  it('3. GET handoff dengan code bekas -> redirect ke /login?error=expired', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/auth/handoff?code=${handoffCode}`)
      .set('Host', 'barokah.umrolink.test')
      .expect(302);
    
    expect(res.headers.location).toBe('/login?error=expired');
  });

  it('4. GET handoff code asal -> redirect error', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/handoff?code=invalid-code-123')
      .set('Host', 'barokah.umrolink.test')
      .expect(302);
      
    expect(res.headers.location).toBe('/login?error=expired');
  });

  it('5. POST login travel_admin di domain tenant -> 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', 'barokah.umrolink.test')
      .send({ email: 'admin@barokah.test', password: 'Password123!' })
      .expect(401);
  });

  it('6. POST login agent di root domain -> 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', 'umrolink.test')
      .send({ email: 'agent@barokah.test', password: 'Password123!' })
      .expect(401);
  });

  it('7. POST login agent di domain tenant -> 201, return token langsung', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', 'barokah.umrolink.test')
      .send({ email: 'agent@barokah.test', password: 'Password123!' })
      .expect(201);
      
    expect(res.body.type).toBe('jwt');
    expect(res.body.access_token).toBeDefined();
    expect(res.body.user.role).toBe('agent');
  });

  it('8. Regresi: POST login super_admin di root domain -> 201, return access_token langsung', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Host', 'umrolink.test')
      .send({ email: 'admin@umrolink.com', password: 'Password123!' })
      .expect(201);
      
    expect(res.body.type).toBe('jwt');
    expect(res.body.access_token).toBeDefined();
    
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/umrolink_token=/);
  });
});
