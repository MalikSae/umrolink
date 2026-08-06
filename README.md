# Umrolink

Umrolink adalah platform SaaS B2B Multi-Tenant untuk manajemen travel umroh.

## Setup untuk Developer Baru

Langkah-langkah untuk menyiapkan environment lokal Anda:

1. **Install Dependencies**
   Jalankan `pnpm install` untuk menginstal semua dependency monorepo.

2. **Buat Database**
   Jalankan `pnpm run setup:db` untuk membuat database `umrolink_dev` dan `umrolink_test` secara otomatis di MySQL lokal Anda.
   *(Pastikan Laragon/MySQL sudah menyala dengan user `root` dan password kosong sesuai default)*.

3. **Migrasi Schema**
   Jalankan migrasi untuk database development:
   `pnpm exec prisma migrate dev`
   Lalu untuk database test:
   `npx dotenv -e .env.test -- pnpm exec prisma migrate dev`

4. **Seed Database**
   Jalankan penyemaian awal (seeding) untuk membuat tenant dummy:
   `pnpm run prisma:seed`

5. **Jalankan Aplikasi**
   Mulai development server (API dan Web):
   `pnpm dev`

### Catatan Penting Mengenai Database Environment (`.env` vs `.env.test`)
- **`.env`** berisi konfigurasi `DATABASE_URL` yang mengarah ke `umrolink_dev`. Environment ini digunakan untuk pengembangan normal dan command seperti `pnpm dev` atau migrasi biasa.
- **`.env.test`** berisi konfigurasi yang menunjuk ke `umrolink_test`. 
- Saat Anda ingin menjalankan *automated test* atau mengubah database test, Anda wajib menyisipkan `dotenv -e .env.test --` di depan perintah Anda (seperti dicontohkan pada langkah migrasi di atas). 
- Menjalankan `pnpm test` sudah otomatis dikonfigurasikan di dalam `package.json` untuk memakai `.env.test`.
