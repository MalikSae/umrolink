import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { RawPrismaService } from '../src/tenancy/raw-prisma.service';

describe('Public API (e2e)', () => {
  let app: INestApplication;
  let prisma: RawPrismaService;

  let barokahTenantId: string;
  let hijazTenantId: string;
  let hijazSlug: string;

  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = app.get(RawPrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. GET /api/public/tenant', () => {
    it('returns tenant data with brand colors for barokah', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/public/tenant')
        .set('Host', 'barokah.umrolink.test')
        .expect(200);

      expect(res.body.name).toBe('Barokah Tour & Travel');
      expect(res.body.brandPrimaryColor).toBe('#0d9488');
      
      const tenantA = await prisma.tenant.findUnique({ where: { subdomain: 'barokah' } });
      barokahTenantId = tenantA!.id;
    });
  });

  describe('2. GET /api/public/packages', () => {
    it('returns only published packages for barokah', async () => {
      const draftPkg = await prisma.package.create({
        data: {
          tenantId: barokahTenantId,
          slug: 'paket-draft-fresh',
          name: 'Paket Draft Fresh',
          status: 'draft',
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/public/packages')
        .set('Host', 'barokah.umrolink.test')
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.some((p: any) => p.name === 'Paket Draft Fresh')).toBe(false); 
      
      await prisma.package.delete({ where: { id: draftPkg.id } });
    });
  });

  describe('3. GET /api/public/packages (Isolation)', () => {
    it('hijaz does not see barokah packages', async () => {
      const tenant = await prisma.tenant.findUnique({ where: { subdomain: 'hijaz' } });
      hijazTenantId = tenant!.id;

      // Seed a hijaz package
      const created = await prisma.package.upsert({
        where: { tenantId_slug: { tenantId: hijazTenantId, slug: 'paket-hijaz-eksklusif' } },
        update: { status: 'published' },
        create: {
          tenantId: hijazTenantId,
          slug: 'paket-hijaz-eksklusif',
          name: 'Paket Hijaz Eksklusif',
          status: 'published',
        }
      });
      hijazSlug = 'paket-hijaz-eksklusif';

      const res = await request(app.getHttpServer())
        .get('/api/public/packages')
        .set('Host', 'hijaz.umrolink.test')
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.some((p: any) => p.name.includes('Turki'))).toBe(false); // Barokah's package isolated
      expect(res.body.some((p: any) => p.name.includes('Hijaz'))).toBe(true);
    });
  });

  describe('4. GET /api/public/packages/:slug (Cross-tenant)', () => {
    it('returns 404 for hijaz slug on barokah host', async () => {
      await request(app.getHttpServer())
        .get(`/api/public/packages/${hijazSlug}`)
        .set('Host', 'barokah.umrolink.test')
        .expect(404);
    });
  });

  describe('5. GET /api/public/packages/:slug (Draft)', () => {
    it('returns 404 for draft package', async () => {
      const draftPkg = await prisma.package.create({
        data: {
          tenantId: barokahTenantId,
          slug: 'paket-draft-slug',
          name: 'Paket Draft Slug',
          status: 'draft',
        },
      });

      await request(app.getHttpServer())
        .get('/api/public/packages/paket-draft-slug')
        .set('Host', 'barokah.umrolink.test')
        .expect(404);

      await prisma.package.delete({ where: { id: draftPkg.id } });
    });
  });

  describe('6. Sanitization of HTML', () => {
    it('sanitizes description on package creation', async () => {
      // Login as admin barokah
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Host', 'barokah.umrolink.test')
        .send({ email: 'admin@barokah.test', password: 'Password123!' });
      
      authToken = loginRes.body.access_token;

      const res = await request(app.getHttpServer())
        .post('/api/packages')
        .set('Host', 'barokah.umrolink.test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Paket XSS Test',
          description: '<p>Halo</p><script>alert(1)</script><strong onclick="evil()">Tebal</strong>',
          departures: [{ departureDate: '2026-10-10', quota: 40 }],
        })
        .expect(201);

      expect(res.body.description).toContain('<p>Halo</p>');
      expect(res.body.description).toContain('<strong>Tebal</strong>');
      expect(res.body.description).not.toContain('<script>');
      expect(res.body.description).not.toContain('onclick');
    });
  });

  describe('7. New Public API Endpoints (Sprint Mobile View)', () => {
    it('1. GET /api/public/banners -> hanya banner active, tenant-scoped', async () => {
      // Setup a banner for Barokah
      await prisma.banner.create({
        data: {
          tenantId: barokahTenantId,
          title: 'Active Banner Barokah',
          active: true,
          order: 1,
        }
      });
      await prisma.banner.create({
        data: {
          tenantId: barokahTenantId,
          title: 'Inactive Banner Barokah',
          active: false,
          order: 2,
        }
      });
      // Setup a banner for Hijaz
      await prisma.banner.create({
        data: {
          tenantId: hijazTenantId,
          title: 'Active Banner Hijaz',
          active: true,
          order: 1,
        }
      });

      const res = await request(app.getHttpServer())
        .get('/api/public/banners')
        .set('Host', 'barokah.umrolink.test')
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.every((b: any) => b.active === true)).toBe(true);
      expect(res.body.some((b: any) => b.title === 'Inactive Banner Barokah')).toBe(false);
      expect(res.body.some((b: any) => b.title === 'Active Banner Hijaz')).toBe(false); // tenant-scoped isolation
    });

    it('2. GET /api/public/departure-months -> array bulan sesuai data seed, terurut kronologis', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/public/departure-months')
        .set('Host', 'barokah.umrolink.test')
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('value'); 
      expect(res.body[0]).toHaveProperty('label'); 

      // Verify chronological sorting (string comparison on value YYYY-MM is enough)
      const values = res.body.map((m: any) => m.value);
      const sortedValues = [...values].sort();
      expect(values).toEqual(sortedValues);
    });

    it('3. GET /api/public/packages?month=X -> hanya package dengan departure di bulan itu', async () => {
      const monthsRes = await request(app.getHttpServer())
        .get('/api/public/departure-months')
        .set('Host', 'barokah.umrolink.test');
      
      const monthVal = monthsRes.body[0].value;
      const res = await request(app.getHttpServer())
        .get(`/api/public/packages?month=${monthVal}`)
        .set('Host', 'barokah.umrolink.test')
        .expect(200);
        
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('4. GET /api/public/packages?featured=true -> hanya package featured', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/public/packages?featured=true')
        .set('Host', 'barokah.umrolink.test')
        .expect(200);
        
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.every((p: any) => p.featured === true)).toBe(true);
    });

    it('5. GET /api/public/tenant -> response include description/address/phoneNumber', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/public/tenant')
        .set('Host', 'barokah.umrolink.test')
        .expect(200);

      expect(res.body.description).toBeDefined();
      expect(res.body.address).toBeDefined();
      expect(res.body.phoneNumber).toBeDefined();
    });
  });
});
