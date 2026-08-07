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
  let tenantB: any;
  let pkg: any;
  let departure1: any;
  let departure2: any;
  let agent: any;
  let adminToken: string;
  let adminTokenB: string;
  let agentToken: string;
  
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

    tenantB = await prisma.tenant.create({
      data: {
        name: 'Tenant B',
        subdomain: 'tenantb',
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

    const adminB = await prisma.user.create({
      data: {
        email: 'admin@tenantb.umrolink.test',
        passwordHash,
        name: 'Admin B',
        role: 'travel_admin',
        tenantId: tenantB.id
      }
    });
    
    adminTokenB = jwt.sign({ sub: adminB.id, email: adminB.email, role: adminB.role, tenantId: adminB.tenantId }, process.env.JWT_SECRET || 'secret');

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
      },
      include: { agentProfile: true }
    });
    
    agentToken = jwt.sign({ sub: agent.id, email: agent.email, role: agent.role, tenantId: agent.tenantId, agentProfileId: agent.agentProfile.id }, process.env.JWT_SECRET || 'secret');
    
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
    await prisma.$disconnect();
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

  // Scenario 11: Race condition test (2 pending confirmed at same time for 1 quota)
  it('11. Race condition - dua confirm request bersamaan saat kuota sisa 1 (TIDAK BOLEH overbooking)', async () => {
    // We create a new departure with quota 1
    const raceDep = await prisma.packageDeparture.create({
      data: {
        tenantId: tenantA.id,
        packageId: pkg.id,
        departureDate: new Date(Date.now() + 86400000 * 40),
        quota: 1
      }
    });

    const lead1 = await prisma.lead.create({
      data: { tenantId: tenantA.id, packageId: pkg.id, departureId: raceDep.id, name: 'Race 1', phone: '08128', status: 'pending' }
    });
    const lead2 = await prisma.lead.create({
      data: { tenantId: tenantA.id, packageId: pkg.id, departureId: raceDep.id, name: 'Race 2', phone: '08129', status: 'pending' }
    });

    // Run simultaneously
    const req1 = request(app.getHttpServer())
      .patch(`/api/leads/${lead1.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'tenanta.umrolink.test')
      .send();

    const req2 = request(app.getHttpServer())
      .patch(`/api/leads/${lead2.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'tenanta.umrolink.test')
      .send();

    const responses = await Promise.all([req1, req2]);

    const statuses = responses.map(r => r.status);
    // Assert KETAT: tepat satu 200, satu lagi HARUS 409 (bukan 500)
    expect(statuses.filter(s => s === 200).length).toBe(1);  // tepat satu sukses
    expect(statuses.filter(s => s === 409).length).toBe(1);  // satunya HARUS 409

    // Verify DB: exactly 1 confirmed lead for this departure (tidak ada overbooking)
    const confirmedInDb = await prisma.lead.count({
      where: { departureId: raceDep.id, status: 'confirmed' }
    });
    expect(confirmedInDb).toBe(1);
  });

  // Scenario 12: Cross tenant public booking 404
  it('12. POST /api/public/leads dengan departureId milik tenant lain -> 404', async () => {
    // Departure 1 belongs to tenantA. We try to book it via tenantB.
    const res = await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', 'tenantb.umrolink.test')
      .send({
        departureId: departure1.id,
        name: 'Sneaky Doe',
        phone: '08130',
      })
      .expect(404);
  });

  // Scenario 13: Patch cancel and then rebook
  it('13. PATCH /api/leads/:id/cancel - membatalkan booking confirmed dan membuka kuota lagi', async () => {
    // Find Jane Doe (which is confirmed and made quota full in Scenario 5)
    const lead = await prisma.lead.findFirst({ where: { name: 'Jane Doe' } });
    
    // Cancel Jane Doe
    await request(app.getHttpServer())
      .patch(`/api/leads/${lead.id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Host', 'tenanta.umrolink.test')
      .expect(200);

    // Now quota should have 1 free space, let's book again
    await request(app.getHttpServer())
      .post('/api/public/leads')
      .set('Host', 'tenanta.umrolink.test')
      .send({
        departureId: departure1.id,
        name: 'Replacement Doe',
        phone: '08131',
      })
      .expect(201);
  });

  // Scenario 14: GET /api/leads dengan token role agent -> 403
  it('14. GET /api/leads dengan token role agent -> 403', async () => {
    await request(app.getHttpServer())
      .get('/api/leads')
      .set('Authorization', `Bearer ${agentToken}`)
      .set('Host', 'tenanta.umrolink.test')
      .expect(403);
  });

  // Scenario 15: Cross-tenant confirmation 404
  it('15. PATCH /api/leads/:id/confirm cross-tenant -> 404', async () => {
    const lead = await prisma.lead.findFirst({ where: { name: 'John Doe' } });
    
    // Try to confirm tenantA's lead using tenantB's admin
    await request(app.getHttpServer())
      .patch(`/api/leads/${lead.id}/confirm`)
      .set('Authorization', `Bearer ${adminTokenB}`)
      .set('Host', 'tenantb.umrolink.test')
      .expect(404);
  });
});
