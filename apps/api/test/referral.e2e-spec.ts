import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { RawPrismaService } from '../src/tenancy/raw-prisma.service';

describe('Referral Attribution (e2e)', () => {
  let app: INestApplication;
  let rawPrisma: RawPrismaService;
  const rootDomain = process.env.TENANT_ROOT_DOMAIN || 'localhost';

  let barokahPkgId = '';
  let hijazPkgId = '';
  let barokahAgentCode = 'BTT001'; // exists in seed
  let barokahPendingAgentCode = 'PENDING1';
  let hijazAgentCode = 'HJZ999';
  let barokahAgentCode2 = 'BTT999';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    
    // Add cookie parser for tests
    const cookieParser = require('cookie-parser');
    app.use(cookieParser());
    
    await app.init();
    rawPrisma = app.get(RawPrismaService);

    // Get Tenants
    const tenantBarokah = await rawPrisma.tenant.findUnique({ where: { subdomain: 'barokah' } });
    const tenantHijaz = await rawPrisma.tenant.findUnique({ where: { subdomain: 'hijaz' } });

    // Ensure we have packages
    const pkg1 = await rawPrisma.package.findFirst({ where: { tenantId: tenantBarokah.id, status: 'published' } });
    barokahPkgId = pkg1.id;
    const pkg2 = await rawPrisma.package.findFirst({ where: { tenantId: tenantHijaz.id, status: 'published' } });
    hijazPkgId = pkg2.id;

    // Cleanup first
    await rawPrisma.agentProfile.deleteMany({
      where: {
        userId: {
          in: (await rawPrisma.user.findMany({
            where: { email: { in: ['agent2@barokah.test', 'pending11@barokah.test', 'agent1@hijaz.test'] } }
          })).map(u => u.id)
        }
      }
    });
    await rawPrisma.user.deleteMany({
      where: {
        email: { in: ['agent2@barokah.test', 'pending11@barokah.test', 'agent1@hijaz.test'] }
      }
    });

    // Create extra test agents
    // BTT002
    const user2 = await rawPrisma.user.create({
      data: {
        email: 'agent2@barokah.test',
        name: 'Agent 2 Barokah',
        role: 'agent',
        passwordHash: 'xx',
        tenantId: tenantBarokah.id,
      }
    });
    await rawPrisma.agentProfile.create({
      data: {
        userId: user2.id,
        tenantId: tenantBarokah.id,
        phone: '081122',
        city: 'Bandung',
        agentCode: barokahAgentCode2,
        status: 'active',
      }
    });

    // PENDING1 for Barokah
    const userPending = await rawPrisma.user.create({
      data: {
        email: 'pending11@barokah.test',
        name: 'Pending Agent 11 Barokah',
        role: 'agent',
        passwordHash: 'xx',
        tenantId: tenantBarokah.id,
      }
    });
    await rawPrisma.agentProfile.create({
      data: {
        userId: userPending.id,
        tenantId: tenantBarokah.id,
        phone: '0811223',
        city: 'Bandung',
        agentCode: barokahPendingAgentCode, // Even if it has a code, it's pending
        status: 'pending',
      }
    });

    // HJZ001
    const userHijaz = await rawPrisma.user.create({
      data: {
        email: 'agent1@hijaz.test',
        name: 'Agent Hijaz',
        role: 'agent',
        passwordHash: 'xx',
        tenantId: tenantHijaz.id,
      }
    });
    await rawPrisma.agentProfile.create({
      data: {
        userId: userHijaz.id,
        tenantId: tenantHijaz.id,
        phone: '0811224',
        city: 'Surabaya',
        agentCode: hijazAgentCode,
        status: 'active',
      }
    });
  });

  afterAll(async () => {
    // Cleanup created agents
    await rawPrisma.agentProfile.deleteMany({
      where: {
        userId: {
          in: (await rawPrisma.user.findMany({
            where: { email: { in: ['agent2@barokah.test', 'pending11@barokah.test', 'agent1@hijaz.test'] } }
          })).map(u => u.id)
        }
      }
    });
    await rawPrisma.user.deleteMany({
      where: {
        email: { in: ['agent2@barokah.test', 'pending11@barokah.test', 'agent1@hijaz.test'] }
      }
    });
    await app.close();
  });

  it('1. POST dengan cookie umrolink_ref valid -> Lead tersimpan dengan agentId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', `barokah.${rootDomain}`)
      .set('Cookie', [`umrolink_ref=${barokahAgentCode}`])
      .send({
        packageId: barokahPkgId,
        name: 'Jamaah Satu',
        phone: '08111111'
      });

    expect(res.status).toBe(201);
    
    // Verify lead
    const lead = await rawPrisma.lead.findUnique({ where: { id: res.body.leadId } });
    expect(lead).toBeDefined();
    expect(lead.agentId).not.toBeNull();
    
    const agent = await rawPrisma.agentProfile.findUnique({ where: { id: lead.agentId } });
    expect(agent.agentCode).toBe(barokahAgentCode);
  });

  it('2. POST TANPA cookie -> Lead tersimpan dengan agentId null', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', `barokah.${rootDomain}`)
      .send({
        packageId: barokahPkgId,
        name: 'Jamaah Dua',
        phone: '08222222'
      });

    expect(res.status).toBe(201);
    const lead = await rawPrisma.lead.findUnique({ where: { id: res.body.leadId } });
    expect(lead.agentId).toBeNull();
  });

  it('3. POST dengan cookie kode agent TIDAK ADA -> agentId null', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', `barokah.${rootDomain}`)
      .set('Cookie', [`umrolink_ref=INVALID123`])
      .send({
        packageId: barokahPkgId,
        name: 'Jamaah Tiga',
        phone: '08333333'
      });

    expect(res.status).toBe(201);
    const lead = await rawPrisma.lead.findUnique({ where: { id: res.body.leadId } });
    expect(lead.agentId).toBeNull();
  });

  it('4. POST dengan cookie kode agent status PENDING -> agentId null', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', `barokah.${rootDomain}`)
      .set('Cookie', [`umrolink_ref=${barokahPendingAgentCode}`])
      .send({
        packageId: barokahPkgId,
        name: 'Jamaah Empat',
        phone: '08444444'
      });

    expect(res.status).toBe(201);
    const lead = await rawPrisma.lead.findUnique({ where: { id: res.body.leadId } });
    expect(lead.agentId).toBeNull();
  });

  it('5. PALING PENTING: Immutability atribusi lead', async () => {
    // Buat Lead A dengan cookie BTT001
    const resA = await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', `barokah.${rootDomain}`)
      .set('Cookie', [`umrolink_ref=${barokahAgentCode}`])
      .send({
        packageId: barokahPkgId,
        name: 'Jamaah Lima A',
        phone: '08555555'
      });
    const leadAId = resA.body.leadId;
    const leadA = await rawPrisma.lead.findUnique({ where: { id: leadAId } });
    expect(leadA.agentId).not.toBeNull();
    const originalAgent = await rawPrisma.agentProfile.findUnique({ where: { id: leadA.agentId } });
    expect(originalAgent.agentCode).toBe(barokahAgentCode);

    // Buat Lead B dengan cookie BTT002
    const resB = await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', `barokah.${rootDomain}`)
      .set('Cookie', [`umrolink_ref=${barokahAgentCode2}`])
      .send({
        packageId: barokahPkgId,
        name: 'Jamaah Lima B',
        phone: '08666666'
      });
    const leadBId = resB.body.leadId;
    const leadB = await rawPrisma.lead.findUnique({ where: { id: leadBId } });
    const secondAgent = await rawPrisma.agentProfile.findUnique({ where: { id: leadB.agentId } });
    expect(secondAgent.agentCode).toBe(barokahAgentCode2);

    // Fetch ulang Lead A
    const leadARefetched = await rawPrisma.lead.findUnique({ where: { id: leadAId } });
    expect(leadARefetched.agentId).toBe(leadA.agentId); // MASIH BTT001
  });

  it('6. Cross-tenant: cookie agent Hijaz dipakai di Barokah -> agentId null', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', `barokah.${rootDomain}`)
      .set('Cookie', [`umrolink_ref=${hijazAgentCode}`])
      .send({
        packageId: barokahPkgId,
        name: 'Jamaah Enam',
        phone: '08777777'
      });

    expect(res.status).toBe(201);
    const lead = await rawPrisma.lead.findUnique({ where: { id: res.body.leadId } });
    expect(lead.agentId).toBeNull();
  });
});
