import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';

describe('Booking (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  
  let tenantA: any;
  let pkg: any;
  let departure1: any;
  let departure2: any;
  let agent: any;
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
    
    // Clean up
    await prisma.banner.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.packageDeparture.deleteMany();
    await prisma.package.deleteMany();
    await prisma.agentProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
    
    // Create tenant
    tenantA = await prisma.tenant.create({
      data: {
        name: 'Tenant A',
        subdomain: 'tenanta',
      }
    });

    // Create admin & token
    const passwordHash = await argon2.hash('Password123!');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@tenanta.umrolink.test',
        passwordHash,
        name: 'Admin A',
        role: 'travel_admin',
        tenantId: tenantA.id
      }
    });
    
    adminToken = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role, tenantId: admin.tenantId }, process.env.JWT_SECRET || 'secret');

    // Create agent
    agent = await prisma.user.create({
      data: {
        email: 'agent@tenanta.umrolink.test',
        passwordHash,
        name: 'Agent A',
        role: 'agent',
        tenantId: tenantA.id,
        agentProfile: {
          create: {
            tenantId: tenantA.id,
            phone: '123',
            city: 'city',
            status: 'active',
            agentCode: 'AGT001'
          }
        }
      }
    });
    
    // Create package
    pkg = await prisma.package.create({
      data: {
        tenantId: tenantA.id,
        name: 'Test Package',
        slug: 'test-package',
        status: 'published'
      }
    });
    
    // Create departures
    // dep1: future, quota 2
    departure1 = await prisma.packageDeparture.create({
      data: {
        tenantId: tenantA.id,
        packageId: pkg.id,
        departureDate: new Date(Date.now() + 86400000 * 30), // 30 days future
        quota: 2
      }
    });
    
    // dep2: past, quota 5
    departure2 = await prisma.packageDeparture.create({
      data: {
        tenantId: tenantA.id,
        packageId: pkg.id,
        departureDate: new Date(Date.now() - 86400000 * 5), // 5 days past
        quota: 5
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // Scenario 1: Sukses create booking pending
  it('1. POST /api/public/leads - sukses create booking', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', 'tenanta.umrolink.test')
      .send({
        departureId: departure1.id,
        name: 'John Doe',
        phone: '08123',
      })
      .expect(201);
      
    expect(res.body.status).toBe('pending');
  });

  // Scenario 2: Cek di public list, package tidak sold (confirmed masih 0)
  it('2. GET /api/public/packages/:slug - isSold false karena baru pending', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/packages/test-package')
      .set('Host', 'tenanta.umrolink.test')
      .expect(200);
      
    const dep = res.body.departures.find((d) => d.id === departure1.id);
    expect(dep.isSold).toBe(false);
  });

  // Scenario 3: Admin konfirmasi booking 1
  it('3. PATCH /api/leads/:id/confirm - sukses confirm booking 1', async () => {
    const leads = await prisma.lead.findMany({ where: { departureId: departure1.id } });
    
    await request(app.getHttpServer())
      .patch(`/api/leads/${leads[0].id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'tenanta.umrolink.test')
      .expect(200);
  });

  // Scenario 4: Create booking 2 (pending)
  it('4. POST /api/public/leads - sukses create booking 2', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', 'tenanta.umrolink.test')
      .send({
        departureId: departure1.id,
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '08124',
      });
      
    if (res.status === 404) {
      console.log('SCENARIO 4 404 BODY:', res.body);
    }
      
    expect(res.status).toBe(201);
  });

  // Scenario 5: Admin konfirmasi booking 2 (quota 2 penuh)
  it('5. PATCH /api/leads/:id/confirm - sukses confirm booking 2 (kuota jadi penuh)', async () => {
    const lead = await prisma.lead.findFirst({ where: { name: 'Jane Doe' } });
    
    await request(app.getHttpServer())
      .patch(`/api/leads/${lead.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'tenanta.umrolink.test')
      .expect(200);
  });

  // Scenario 6: Cek public list, package sold
  it('6. GET /api/public/packages/:slug - isSold true karena confirmed=2, quota=2', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/packages/test-package')
      .set('Host', 'tenanta.umrolink.test')
      .expect(200);
      
    const dep = res.body.departures.find((d) => d.id === departure1.id);
    expect(dep.isSold).toBe(true);
  });

  // Scenario 7: Booking ke paket yang sudah SOLD
  it('7. POST /api/public/leads - gagal karena kuota penuh', async () => {
    await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', 'tenanta.umrolink.test')
      .send({
        departureId: departure1.id,
        name: 'Jack Doe',
        phone: '08125',
      })
      .expect(409); // 409 Conflict from PublicService (quota full)
  });

  // Scenario 8: Admin gagal konfirmasi booking kalau kuota penuh
  // Untuk test ini, kita insert lead "pending" manual by prisma
  it('8. PATCH /api/leads/:id/confirm - gagal karena kuota penuh', async () => {
    const lead3 = await prisma.lead.create({
      data: {
        tenantId: tenantA.id,
        packageId: pkg.id,
        departureId: departure1.id,
        name: 'Pending Bypass',
        phone: '08126',
        status: 'pending'
      }
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/leads/${lead3.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'tenanta.umrolink.test')
      .expect(409); // 409 Conflict from LeadsService
      
    expect(res.body.message).toContain('Kuota keberangkatan sudah penuh');
  });

  // Scenario 9: Booking ke paket past
  it('9. POST /api/public/leads - gagal karena tanggal sudah lewat', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', 'tenanta.umrolink.test')
      .send({
        departureId: departure2.id, // past departure
        name: 'Past Doe',
        phone: '08127',
      })
      .expect(400);
      
    expect(res.body.message).toContain('Tanggal keberangkatan ini sudah lewat');
  });

  // Scenario 10: Cek list admin bookings
  it('10. GET /api/leads - admin dapat list booking', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'tenanta.umrolink.test')
      .expect(200);
      
    // Should have John Doe, Jane Doe, Pending Bypass
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    expect(res.body[0]).toHaveProperty('package');
    expect(res.body[0]).toHaveProperty('departure');
  });
});
