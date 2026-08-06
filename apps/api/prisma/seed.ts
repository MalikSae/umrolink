import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding tenants...');

  const tenantA = await prisma.tenant.upsert({
    where: { subdomain: 'barokah' },
    update: {
      brandPrimaryColor: '#0d9488',
      brandSecondaryColor: '#0f766e',
      brandAccentColor: '#14b8a6',
      agentCodeSeq: 1,  // BTT001 sudah dipakai seed agent, mulai dari 1
      description: 'Travel umrah terpercaya dengan pelayanan sepenuh hati. Kami mendampingi perjalanan ibadah Anda menuju Baitullah dengan nyaman dan aman.',
      address: 'Jl. Jenderal Sudirman No.123, Jakarta Selatan',
      phoneNumber: '081122334455',
    },
    create: {
      name: 'Barokah Tour & Travel',
      subdomain: 'barokah',
      brandPrimaryColor: '#0d9488',
      brandSecondaryColor: '#0f766e',
      brandAccentColor: '#14b8a6',
      agentCodeSeq: 1,
      description: 'Travel umrah terpercaya dengan pelayanan sepenuh hati. Kami mendampingi perjalanan ibadah Anda menuju Baitullah dengan nyaman dan aman.',
      address: 'Jl. Jenderal Sudirman No.123, Jakarta Selatan',
      phoneNumber: '081122334455',
    },
  });

  const tenantB = await prisma.tenant.upsert({
    where: { subdomain: 'hijaz' },
    update: {
      brandPrimaryColor: '#9333ea',
      brandSecondaryColor: '#7e22ce',
      brandAccentColor: '#a855f7',
      description: 'Mitra perjalanan ibadah Anda yang mengutamakan sunnah dan kenyamanan ekstra. Fokus beribadah, kami yang urus sisanya.',
      address: 'Jl. Setiabudi No.45, Bandung',
      phoneNumber: '081299887766',
    },
    create: {
      name: 'Hijaz Umrah',
      subdomain: 'hijaz',
      brandPrimaryColor: '#9333ea',
      brandSecondaryColor: '#7e22ce',
      brandAccentColor: '#a855f7',
      description: 'Mitra perjalanan ibadah Anda yang mengutamakan sunnah dan kenyamanan ekstra. Fokus beribadah, kami yang urus sisanya.',
      address: 'Jl. Setiabudi No.45, Bandung',
      phoneNumber: '081299887766',
    },
  });

  console.log({ tenantA, tenantB });

  console.log('Seeding users...');
  const passwordHash = await argon2.hash('Password123!');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@umrolink.com' },
    update: {},
    create: {
      email: 'admin@umrolink.com',
      name: 'Super Admin',
      role: 'super_admin',
      passwordHash,
      tenantId: null,
    }
  });

  const adminBarokah = await prisma.user.upsert({
    where: { email: 'admin@barokah.test' },
    update: {},
    create: {
      email: 'admin@barokah.test',
      name: 'Admin Barokah',
      role: 'travel_admin',
      passwordHash,
      tenantId: tenantA.id,
    }
  });

  const agentBarokah = await prisma.user.upsert({
    where: { email: 'agent@barokah.test' },
    update: {},
    create: {
      email: 'agent@barokah.test',
      name: 'Agent Barokah',
      role: 'agent',
      passwordHash,
      tenantId: tenantA.id,
    }
  });

  // Ensure agentProfile always exists for agentBarokah
  await prisma.agentProfile.upsert({
    where: { userId: agentBarokah.id },
    update: { status: 'active', agentCode: 'BTT001', city: 'Kota Bandung' },
    create: {
      userId: agentBarokah.id,
      tenantId: tenantA.id,
      phone: '081234567890',
      city: 'Kota Bandung',
      agentCode: 'BTT001',
      status: 'active',
    }
  });

  const pendingAgent1 = await prisma.user.upsert({
    where: { email: 'pending1@barokah.test' },
    update: {},
    create: {
      email: 'pending1@barokah.test',
      name: 'Budi Santoso',
      role: 'agent',
      passwordHash,
      tenantId: tenantA.id,
    }
  });
  await prisma.agentProfile.upsert({
    where: { userId: pendingAgent1.id },
    update: { status: 'pending', agentCode: null, city: 'Kota Administrasi Jakarta Selatan' },
    create: {
      userId: pendingAgent1.id,
      tenantId: tenantA.id,
      phone: '085677778888',
      city: 'Kota Administrasi Jakarta Selatan',
      status: 'pending',
      agentCode: null,
    }
  });

  const pendingAgent2 = await prisma.user.upsert({
    where: { email: 'pending2@barokah.test' },
    update: {},
    create: {
      email: 'pending2@barokah.test',
      name: 'Siti Aminah',
      role: 'agent',
      passwordHash,
      tenantId: tenantA.id,
    }
  });
  await prisma.agentProfile.upsert({
    where: { userId: pendingAgent2.id },
    update: { city: 'Kota Surabaya' },
    create: {
      userId: pendingAgent2.id,
      tenantId: tenantA.id,
      phone: '081122223333',
      city: 'Kota Surabaya',
      status: 'pending',
    }
  });

  const adminHijaz = await prisma.user.upsert({
    where: { email: 'admin@hijaz.test' },
    update: {},
    create: {
      email: 'admin@hijaz.test',
      name: 'Admin Hijaz',
      role: 'travel_admin',
      passwordHash,
      tenantId: tenantB.id,
    }
  });

  console.log({ superAdmin, adminBarokah, agentBarokah, pendingAgent1, pendingAgent2, adminHijaz });

  console.log('Seeding packages...');
  
  const pkg1 = await prisma.package.upsert({
    where: { id: 'test-pkg-1' },
    update: {
      slug: 'paket-umrah-plus-turki-12-hari',
      name: 'Paket Umrah Plus Turki 12 Hari',
      description: '<p>Keberangkatan akhir tahun dengan pelayanan <strong>terbaik</strong>. Kunjungi Istanbul dan Cappadocia sebelum menuju ke Tanah Suci.</p>',
      airline: 'Turkish Airlines',
      hotelMakkah: 'Swissôtel Al Maqam Makkah',
      hotelMadinah: 'Pullman Zamzam Madina',
      include: '<ul><li>Tiket Pesawat PP (Jakarta - Istanbul - Makkah - Jakarta)</li><li>Visa Umrah & Visa Turki</li><li>Akomodasi Hotel Bintang 5</li><li>Makan 3x sehari (Menu Indonesia)</li><li>Transportasi Bus AC</li><li>Muthawwif & Tour Guide berpengalaman</li><li>Air Zamzam 5 Liter</li></ul>',
      exclude: '<ul><li>Pembuatan Paspor</li><li>Vaksin Meningitis</li><li>Pengeluaran Pribadi</li><li>Kelebihan Bagasi</li></ul>',
      agentCommission: 1500000,
      status: 'published',
      priceQuad: 35000000,
      priceTriple: 37500000,
      priceDouble: 40000000,
      featuredImage: 'https://placehold.co/800x800/0d9488/ffffff.png?text=Umrah+Turki',
      featured: true,
    },
    create: {
      id: 'test-pkg-1',
      tenantId: tenantA.id,
      slug: 'paket-umrah-plus-turki-12-hari',
      name: 'Paket Umrah Plus Turki 12 Hari',
      description: '<p>Keberangkatan akhir tahun dengan pelayanan <strong>terbaik</strong>. Kunjungi Istanbul dan Cappadocia sebelum menuju ke Tanah Suci.</p>',
      airline: 'Turkish Airlines',
      hotelMakkah: 'Swissôtel Al Maqam Makkah',
      hotelMadinah: 'Pullman Zamzam Madina',
      include: '<ul><li>Tiket Pesawat PP (Jakarta - Istanbul - Makkah - Jakarta)</li><li>Visa Umrah & Visa Turki</li><li>Akomodasi Hotel Bintang 5</li><li>Makan 3x sehari (Menu Indonesia)</li><li>Transportasi Bus AC</li><li>Muthawwif & Tour Guide berpengalaman</li><li>Air Zamzam 5 Liter</li></ul>',
      exclude: '<ul><li>Pembuatan Paspor</li><li>Vaksin Meningitis</li><li>Pengeluaran Pribadi</li><li>Kelebihan Bagasi</li></ul>',
      agentCommission: 1500000,
      status: 'published',
      priceQuad: 35000000,
      priceTriple: 37500000,
      priceDouble: 40000000,
      featuredImage: 'https://placehold.co/800x800/0d9488/ffffff.png?text=Umrah+Turki',
      featured: true,
    }
  });

  const pkg2 = await prisma.package.upsert({
    where: { id: 'test-pkg-2' },
    update: {
      slug: 'paket-umrah-reguler-9-hari',
      name: 'Paket Umrah Reguler 9 Hari',
      description: '<p>Program umrah reguler dengan harga terjangkau namun tetap memberikan pelayanan prima bagi para jamaah.</p>',
      airline: 'Saudia Airlines',
      hotelMakkah: 'Azka Al Safa',
      hotelMadinah: 'Concorde Dar Al Khair',
      include: '<ul><li>Tiket Pesawat PP (Direct Madinah)</li><li>Visa Umrah</li><li>Akomodasi Hotel Bintang 4</li><li>Makan 3x sehari</li><li>Transportasi Bus AC</li><li>Muthawwif</li><li>Air Zamzam 5 Liter</li></ul>',
      exclude: '<ul><li>Pembuatan Paspor & Vaksin</li><li>Keperluan Pribadi (Telepon, Laundry, dll)</li><li>Tour di luar program</li></ul>',
      agentCommission: 1000000,
      status: 'published',
      priceQuad: 28500000,
      priceTriple: 30000000,
      priceDouble: 31500000,
      featuredImage: 'https://placehold.co/800x800/0d9488/ffffff.png?text=Umrah+Reguler',
    },
    create: {
      id: 'test-pkg-2',
      tenantId: tenantA.id,
      slug: 'paket-umrah-reguler-9-hari',
      name: 'Paket Umrah Reguler 9 Hari',
      description: '<p>Program umrah reguler dengan harga terjangkau namun tetap memberikan pelayanan prima bagi para jamaah.</p>',
      airline: 'Saudia Airlines',
      hotelMakkah: 'Azka Al Safa',
      hotelMadinah: 'Concorde Dar Al Khair',
      include: '<ul><li>Tiket Pesawat PP (Direct Madinah)</li><li>Visa Umrah</li><li>Akomodasi Hotel Bintang 4</li><li>Makan 3x sehari</li><li>Transportasi Bus AC</li><li>Muthawwif</li><li>Air Zamzam 5 Liter</li></ul>',
      exclude: '<ul><li>Pembuatan Paspor & Vaksin</li><li>Keperluan Pribadi (Telepon, Laundry, dll)</li><li>Tour di luar program</li></ul>',
      agentCommission: 1000000,
      status: 'published',
      priceQuad: 28500000,
      priceTriple: 30000000,
      priceDouble: 31500000,
      featuredImage: 'https://placehold.co/800x800/0d9488/ffffff.png?text=Umrah+Reguler',
    }
  });

  const pkg3 = await prisma.package.upsert({
    where: { id: 'pkg-3' },
    update: {
      slug: 'paket-umrah-itikaf-ramadhan',
      name: 'Paket Umrah Itikaf Ramadhan (15 Hari)',
      description: '<p>Raih kemuliaan Lailatul Qadar dengan beritikaf di Masjidil Haram pada 10 hari terakhir bulan suci Ramadhan.</p>',
      airline: 'Garuda Indonesia',
      hotelMakkah: 'Movenpick Hajar Tower',
      hotelMadinah: 'Anwar Al Madinah Movenpick',
      include: '<ul><li>Tiket Pesawat PP</li><li>Visa Umrah</li><li>Akomodasi Hotel Bintang 5 di Makkah (Depan Haram)</li><li>Menu Sahur dan Buka Puasa</li><li>Pembimbing Ibadah (Ustadz Nasional)</li><li>Air Zamzam 5 Liter</li></ul>',
      exclude: '<ul><li>Paspor & Vaksin</li><li>Pengeluaran Pribadi</li><li>Kelebihan Bagasi</li></ul>',
      agentCommission: 2000000,
      status: 'published',
      priceQuad: 45000000,
      priceTriple: 48500000,
      priceDouble: 52000000,
      featuredImage: 'https://placehold.co/800x800/0d9488/ffffff.png?text=Umrah+Ramadhan',
    },
    create: {
      id: 'pkg-3',
      tenantId: tenantA.id,
      slug: 'paket-umrah-itikaf-ramadhan',
      name: 'Paket Umrah Itikaf Ramadhan (15 Hari)',
      description: '<p>Raih kemuliaan Lailatul Qadar dengan beritikaf di Masjidil Haram pada 10 hari terakhir bulan suci Ramadhan.</p>',
      airline: 'Garuda Indonesia',
      hotelMakkah: 'Movenpick Hajar Tower',
      hotelMadinah: 'Anwar Al Madinah Movenpick',
      include: '<ul><li>Tiket Pesawat PP</li><li>Visa Umrah</li><li>Akomodasi Hotel Bintang 5 di Makkah (Depan Haram)</li><li>Menu Sahur dan Buka Puasa</li><li>Pembimbing Ibadah (Ustadz Nasional)</li><li>Air Zamzam 5 Liter</li></ul>',
      exclude: '<ul><li>Paspor & Vaksin</li><li>Pengeluaran Pribadi</li><li>Kelebihan Bagasi</li></ul>',
      agentCommission: 2000000,
      status: 'published',
      priceQuad: 45000000,
      priceTriple: 48500000,
      priceDouble: 52000000,
      featuredImage: 'https://placehold.co/800x800/0d9488/ffffff.png?text=Umrah+Ramadhan',
    }
  });

  const pkg4 = await prisma.package.upsert({
    where: { id: 'pkg-4' },
    update: {
      slug: 'paket-umrah-plus-aqsa-10-hari',
      name: 'Paket Umrah Plus Aqsa 10 Hari',
      description: '<p>Kunjungi 3 Masjid Suci: Masjidil Haram, Masjid Nabawi, dan Masjid Al-Aqsa dalam satu perjalanan yang penuh berkah.</p>',
      airline: 'Royal Jordanian',
      hotelMakkah: 'Rayhaan by Rotana',
      hotelMadinah: 'Rove Madina',
      include: '<ul><li>Tiket Pesawat PP</li><li>Visa Umrah & Visa Israel (Aqsa)</li><li>Akomodasi Hotel Bintang 4 & 5</li><li>Makan 3x sehari</li><li>Transportasi Bus VIP</li><li>Muthawwif & Local Guide Jerusalem</li><li>Air Zamzam</li></ul>',
      exclude: '<ul><li>Paspor & Vaksin</li><li>Asuransi Perjalanan Tambahan</li><li>Keperluan Pribadi</li></ul>',
      agentCommission: 1750000,
      status: 'published',
      priceQuad: 42000000,
      priceTriple: 44000000,
      priceDouble: 47000000,
      featuredImage: 'https://placehold.co/800x800/9333ea/ffffff.png?text=Umrah+Plus+Aqsa',
    },
    create: {
      id: 'pkg-4',
      tenantId: tenantB.id,
      slug: 'paket-umrah-plus-aqsa-10-hari',
      name: 'Paket Umrah Plus Aqsa 10 Hari',
      description: '<p>Kunjungi 3 Masjid Suci: Masjidil Haram, Masjid Nabawi, dan Masjid Al-Aqsa dalam satu perjalanan yang penuh berkah.</p>',
      airline: 'Royal Jordanian',
      hotelMakkah: 'Rayhaan by Rotana',
      hotelMadinah: 'Rove Madina',
      include: '<ul><li>Tiket Pesawat PP</li><li>Visa Umrah & Visa Israel (Aqsa)</li><li>Akomodasi Hotel Bintang 4 & 5</li><li>Makan 3x sehari</li><li>Transportasi Bus VIP</li><li>Muthawwif & Local Guide Jerusalem</li><li>Air Zamzam</li></ul>',
      exclude: '<ul><li>Paspor & Vaksin</li><li>Asuransi Perjalanan Tambahan</li><li>Keperluan Pribadi</li></ul>',
      agentCommission: 1750000,
      status: 'published',
      priceQuad: 42000000,
      priceTriple: 44000000,
      priceDouble: 47000000,
      featuredImage: 'https://placehold.co/800x800/9333ea/ffffff.png?text=Umrah+Plus+Aqsa',
    }
  });

  const pkg5 = await prisma.package.upsert({
    where: { id: 'pkg-5' },
    update: {
      slug: 'paket-umrah-ekonomis-10-hari',
      name: 'Paket Umrah Ekonomis 10 Hari',
      description: '<p>Solusi ibadah umrah dengan budget hemat tanpa mengurangi kekhusyukan dan kenyamanan. Penerbangan transit yang efisien.</p>',
      airline: 'Oman Air',
      hotelMakkah: 'Olayan Ajyad',
      hotelMadinah: 'Diyar Al Salam',
      include: '<ul><li>Tiket Pesawat PP (Transit)</li><li>Visa Umrah</li><li>Akomodasi Hotel Bintang 3</li><li>Makan 3x sehari (Box/Catering)</li><li>Transportasi Bus Standard</li><li>Muthawwif</li><li>Air Zamzam 5L</li></ul>',
      exclude: '<ul><li>Paspor & Vaksin</li><li>Handling Bandara & Perlengkapan</li><li>Pengeluaran Pribadi</li></ul>',
      agentCommission: 750000,
      status: 'draft',
      priceQuad: 24000000,
      priceTriple: 25500000,
      priceDouble: 27000000,
      featuredImage: 'https://placehold.co/800x800/9333ea/ffffff.png?text=Umrah+Ekonomis',
    },
    create: {
      id: 'pkg-5',
      tenantId: tenantB.id,
      slug: 'paket-umrah-ekonomis-10-hari',
      name: 'Paket Umrah Ekonomis 10 Hari',
      description: '<p>Solusi ibadah umrah dengan budget hemat tanpa mengurangi kekhusyukan dan kenyamanan. Penerbangan transit yang efisien.</p>',
      airline: 'Oman Air',
      hotelMakkah: 'Olayan Ajyad',
      hotelMadinah: 'Diyar Al Salam',
      include: '<ul><li>Tiket Pesawat PP (Transit)</li><li>Visa Umrah</li><li>Akomodasi Hotel Bintang 3</li><li>Makan 3x sehari (Box/Catering)</li><li>Transportasi Bus Standard</li><li>Muthawwif</li><li>Air Zamzam 5L</li></ul>',
      exclude: '<ul><li>Paspor & Vaksin</li><li>Handling Bandara & Perlengkapan</li><li>Pengeluaran Pribadi</li></ul>',
      agentCommission: 750000,
      status: 'draft',
      priceQuad: 24000000,
      priceTriple: 25500000,
      priceDouble: 27000000,
      featuredImage: 'https://placehold.co/800x800/9333ea/ffffff.png?text=Umrah+Ekonomis',
    }
  });

  console.log({ pkg1, pkg2, pkg3, pkg4, pkg5 });

  console.log('Seeding departures...');
  await prisma.packageDeparture.deleteMany(); // clean up first
  
  const dep1 = await prisma.packageDeparture.create({
    data: {
      tenantId: tenantA.id,
      packageId: pkg1.id,
      departureDate: new Date('2026-12-15T00:00:00.000Z'),
      quota: 45,
    }
  });

  const dep2 = await prisma.packageDeparture.create({
    data: {
      tenantId: tenantA.id,
      packageId: pkg1.id,
      departureDate: new Date('2026-12-25T00:00:00.000Z'),
      quota: 45,
    }
  });

  const dep3 = await prisma.packageDeparture.create({
    data: {
      tenantId: tenantA.id,
      packageId: pkg2.id,
      departureDate: new Date('2027-01-10T00:00:00.000Z'),
      quota: 40,
    }
  });

  const dep4 = await prisma.packageDeparture.create({
    data: {
      tenantId: tenantA.id,
      packageId: pkg3.id,
      departureDate: new Date('2026-03-20T00:00:00.000Z'),
      quota: 40,
    }
  });

  const dep5 = await prisma.packageDeparture.create({
    data: {
      tenantId: tenantB.id,
      packageId: pkg4.id,
      departureDate: new Date('2026-11-10T00:00:00.000Z'),
      quota: 30,
    }
  });

  console.log('Seeding leads...');
  await prisma.lead.deleteMany(); // clean up first
  await prisma.lead.createMany({
    data: [
      {
        tenantId: tenantA.id,
        packageId: pkg1.id,
        departureId: dep1.id,
        name: 'Hamba Allah',
        phone: '081234567890',
        status: 'confirmed',
      },
      {
        tenantId: tenantA.id,
        packageId: pkg1.id,
        departureId: dep1.id,
        name: 'Fulan',
        phone: '081234567891',
        status: 'pending',
      },
      {
        tenantId: tenantA.id,
        packageId: pkg2.id,
        departureId: dep3.id,
        name: 'Fulanah',
        phone: '081234567892',
        status: 'confirmed',
      }
    ]
  });

  console.log('Seeding banners...');
  const banner1 = await prisma.banner.upsert({
    where: { id: 'banner-1' },
    update: {
      title: 'Diskon Akhir Tahun',
      subtitle: 'Dapatkan potongan harga khusus untuk keberangkatan Desember 2026.',
      imageUrl: 'https://placehold.co/1200x675/0d9488/ffffff.png?text=Diskon+Akhir+Tahun',
      ctaLabel: 'Lihat Paket',
      packageId: pkg1.id,
      order: 1,
      active: true,
    },
    create: {
      id: 'banner-1',
      tenantId: tenantA.id,
      title: 'Diskon Akhir Tahun',
      subtitle: 'Dapatkan potongan harga khusus untuk keberangkatan Desember 2026.',
      imageUrl: 'https://placehold.co/1200x675/0d9488/ffffff.png?text=Diskon+Akhir+Tahun',
      ctaLabel: 'Lihat Paket',
      packageId: pkg1.id,
      order: 1,
      active: true,
    }
  });

  const banner2 = await prisma.banner.upsert({
    where: { id: 'banner-2' },
    update: {
      title: 'Program Umrah Reguler',
      subtitle: 'Perjalanan penuh berkah dengan fasilitas lengkap.',
      imageUrl: 'https://placehold.co/1200x675/0f766e/ffffff.png?text=Program+Umrah+Reguler',
      ctaLabel: 'Daftar Sekarang',
      packageId: pkg2.id,
      order: 2,
      active: true,
    },
    create: {
      id: 'banner-2',
      tenantId: tenantA.id,
      title: 'Program Umrah Reguler',
      subtitle: 'Perjalanan penuh berkah dengan fasilitas lengkap.',
      imageUrl: 'https://placehold.co/1200x675/0f766e/ffffff.png?text=Program+Umrah+Reguler',
      ctaLabel: 'Daftar Sekarang',
      packageId: pkg2.id,
      order: 2,
      active: true,
    }
  });

  console.log({ banner1, banner2 });

  console.log('Seed finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
