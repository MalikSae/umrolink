import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';
import { RawPrismaService } from '../src/tenancy/raw-prisma.service';
import * as argon2 from 'argon2';

describe('Agent Registration & Approval (e2e)', () => {
  let app: INestApplication;
  let rawPrisma: RawPrismaService;
  let tenantId: string;
  let travelAdminToken: string;
  let agentId: string;
  let agentId2: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    rawPrisma = app.get<RawPrismaService>(RawPrismaService);
    
    const tenant = await rawPrisma.tenant.findFirst({
      where: { subdomain: 'barokah' }
    });
    tenantId = tenant.id;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('host', 'barokah.umrolink.test')
      .send({ email: 'admin@barokah.test', password: 'Password123!' });
    
    if (loginRes.body && loginRes.body.access_token) {
      travelAdminToken = loginRes.body.access_token;
    } else {
      throw new Error('Failed to login travel admin in test');
    }
  });

  afterAll(async () => {
    await rawPrisma.user.deleteMany({
      where: { email: { startsWith: 'testagent' } }
    });
    await rawPrisma.user.deleteMany({
      where: { email: { startsWith: 'concurrent' } }
    });
    await rawPrisma.user.deleteMany({
      where: { email: { startsWith: 'rejectme' } }
    });
    // Reset sequence safely for repeatable tests
    await rawPrisma.tenant.update({
      where: { id: tenantId },
      data: { agentCodeSeq: 1 }
    });
    await app.close();
  });

  it('1. should register a new agent via public endpoint', async () => {
    const res = await request(app.getHttpServer())
      .post('/public/agents/register')
      .set('host', 'barokah.umrolink.test')
      .send({
        name: 'Test Agent 1',
        email: 'testagent1@example.com',
        password: 'password123',
        phone: '08123456789',
        city: 'Kota Bandung'
      });
    expect(res.status).toBe(201);
    expect(res.body.message).toContain('berhasil');
  });

  it('2. should fail to register if email already exists', async () => {
    const res = await request(app.getHttpServer())
      .post('/public/agents/register')
      .set('host', 'barokah.umrolink.test')
      .send({
        name: 'Test Agent Duplicate',
        email: 'testagent1@example.com',
        password: 'password123',
        phone: '08123456789',
        city: 'Kota Bandung'
      });
    expect(res.status).toBe(409);
  });

  it('2.5. should fail to register if city is missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/public/agents/register')
      .set('host', 'barokah.umrolink.test')
      .send({
        name: 'Test Agent Missing City',
        email: 'testagent-nocity@example.com',
        password: 'password123',
        phone: '08123456789'
      });
    expect(res.status).toBe(400);
  });

  it('2.6. should fail to register if city is invalid', async () => {
    const res = await request(app.getHttpServer())
      .post('/public/agents/register')
      .set('host', 'barokah.umrolink.test')
      .send({
        name: 'Test Agent Invalid City',
        email: 'testagent-invalidcity@example.com',
        password: 'password123',
        phone: '08123456789',
        city: 'Kota Invalid'
      });
    expect(res.status).toBe(400);
  });

  it('3. should prevent pending agent from logging in', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .set('host', 'barokah.umrolink.test')
      .send({
        email: 'testagent1@example.com',
        password: 'password123'
      });
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('menunggu persetujuan');
  });

  it('4. should allow travel_admin to fetch agents list', async () => {
    const res = await request(app.getHttpServer())
      .get('/agents')
      .set('host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${travelAdminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const agent = res.body.find(a => a.user.email === 'testagent1@example.com');
    expect(agent).toBeDefined();
    expect(agent.status).toBe('pending');
  });

  it('5. should allow travel_admin to approve agent', async () => {
    const user = await rawPrisma.user.findUnique({
      where: { email: 'testagent1@example.com' },
      include: { agentProfile: true }
    });
    
    // We expect BTT002 because BTT001 is already taken by the seed data
    const res = await request(app.getHttpServer())
      .post(`/agents/${user.agentProfile.id}/approve`)
      .set('host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${travelAdminToken}`);
      
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('active');
    expect(res.body.agentCode).toMatch(/^BTT002$/);
  });

  it('6. should allow active agent to log in', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .set('host', 'barokah.umrolink.test')
      .send({
        email: 'testagent1@example.com',
        password: 'password123'
      });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('agent');
  });

  it('7. should generate sequential agent code (e.g. BTT003) for the next approved agent', async () => {
    await request(app.getHttpServer())
      .post('/public/agents/register')
      .set('host', 'barokah.umrolink.test')
      .send({
        name: 'Test Agent 2',
        email: 'testagent2@example.com',
        password: 'password123',
        phone: '08123456789',
        city: 'Kota Bandung'
      });
      
    const user2 = await rawPrisma.user.findUnique({
      where: { email: 'testagent2@example.com' },
      include: { agentProfile: true }
    });
    
    const res = await request(app.getHttpServer())
      .post(`/agents/${user2.agentProfile.id}/approve`)
      .set('host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${travelAdminToken}`);
      
    expect(res.status).toBe(201);
    expect(res.body.agentCode).toMatch(/^BTT003$/);
  });

  it('8. should allow travel_admin to reject/delete agent', async () => {
    const user2 = await rawPrisma.user.findUnique({
      where: { email: 'testagent2@example.com' },
      include: { agentProfile: true }
    });
    
    const res = await request(app.getHttpServer())
      .post(`/agents/${user2.agentProfile.id}/reject`)
      .set('host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${travelAdminToken}`);
      
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    
    const deletedUser = await rawPrisma.user.findUnique({
      where: { email: 'testagent2@example.com' }
    });
    expect(deletedUser).toBeNull();
  });

  it('9. should fail to approve if agent profile does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post(`/agents/nonexistent123/approve`)
      .set('host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${travelAdminToken}`);
    expect(res.status).toBe(404);
  });

  it('10. should fail to reject if agent profile does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post(`/agents/nonexistent123/reject`)
      .set('host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${travelAdminToken}`);
    expect(res.status).toBe(404);
  });

  it('11. should handle concurrent approvals safely (test concurrency)', async () => {
    // Buat 5 agent pending secara berurutan
    const agents = [];
    for (let i = 1; i <= 5; i++) {
      await request(app.getHttpServer())
        .post('/public/agents/register')
        .set('host', 'barokah.umrolink.test')
        .send({
          name: `Concurrent Agent ${i}`,
          email: `concurrent${i}@example.com`,
          password: 'password123',
          phone: `08111222${i}`,
          city: 'Kota Bandung'
        });
        
      const user = await rawPrisma.user.findUnique({
        where: { email: `concurrent${i}@example.com` },
        include: { agentProfile: true }
      });
      agents.push(user);
    }
    
    // Tembak API approve secara bersamaan (Promise.all)
    const approvePromises = agents.map(agent => 
      request(app.getHttpServer())
        .post(`/agents/${agent.agentProfile.id}/approve`)
        .set('host', 'barokah.umrolink.test')
        .set('Authorization', `Bearer ${travelAdminToken}`)
    );
    
    const results = await Promise.all(approvePromises);
    
    // Semuanya harus sukses
    results.forEach(res => {
      expect(res.status).toBe(201);
      expect(res.body.agentCode).toBeDefined();
    });
    
    // Extract agent codes
    const agentCodes = results.map(res => res.body.agentCode);
    
    // Check duplikasi
    const uniqueCodes = new Set(agentCodes);
    expect(uniqueCodes.size).toBe(5); // 5 request harus dapat kode berbeda
    
    // Check format (harus ada BTT004, BTT005, BTT006, BTT007, BTT008)
    const expectedCodes = ['BTT004', 'BTT005', 'BTT006', 'BTT007', 'BTT008'];
    const sortedGenerated = [...agentCodes].sort();
    expect(sortedGenerated).toEqual(expectedCodes);
  });

  it('12. should forbid agent from fetching agents list (role check)', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('host', 'barokah.umrolink.test')
      .send({
        email: 'testagent1@example.com',
        password: 'password123'
      });
    const agentToken = loginRes.body.access_token;
      
    const res = await request(app.getHttpServer())
      .get('/agents')
      .set('host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${agentToken}`);
    expect(res.status).toBe(403);
  });

  it('13. should reject a pending agent and ensure it does not appear in list', async () => {
    await request(app.getHttpServer())
      .post('/public/agents/register')
      .set('host', 'barokah.umrolink.test')
      .send({
        name: 'Agent to Reject',
        email: 'rejectme@example.com',
        password: 'password123',
        phone: '08123456789',
        city: 'Kota Bandung'
      });
      
    const user = await rawPrisma.user.findUnique({
      where: { email: 'rejectme@example.com' },
      include: { agentProfile: true }
    });
    
    await request(app.getHttpServer())
      .post(`/agents/${user.agentProfile.id}/reject`)
      .set('host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${travelAdminToken}`);
      
    const res = await request(app.getHttpServer())
      .get('/agents')
      .set('host', 'barokah.umrolink.test')
      .set('Authorization', `Bearer ${travelAdminToken}`);
      
    expect(res.status).toBe(200);
    const found = res.body.find(a => a.user && a.user.email === 'rejectme@example.com');
    expect(found).toBeUndefined();
  });

  it('14. should allow registering again with the same email after being rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/public/agents/register')
      .set('host', 'barokah.umrolink.test')
      .send({
        name: 'Agent Registered Again',
        email: 'rejectme@example.com',
        password: 'password123',
        phone: '0899999999',
        city: 'Kota Bandung'
      });
    expect(res.status).toBe(201);
  });
});

