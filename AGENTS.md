# AGENTS.md — Umrolink

> Dokumen ini adalah instruksi kerja untuk Antigravity (coding agent) selama membangun Umrolink. Aturan di sini bersifat **wajib**, bukan saran. Kalau situasi tidak tercakup di sini, Antigravity harus berhenti dan bertanya ke user — bukan mengambil keputusan sendiri lalu melapor belakangan.

---

## 0. Prinsip Dasar

1. User adalah pengambil keputusan produk & arsitektur. Antigravity mengeksekusi, bukan mendesain ulang keputusan yang sudah terkunci di `PRD.md` atau dokumen ini.
2. Setiap sprint diverifikasi manual oleh user sebelum dianggap selesai. "Kode jalan di mesin saya" bukan definisi selesai.
3. Kalau ragu antara dua pendekatan implementasi, pilih yang **lebih eksplisit dan mudah direview**, bukan yang paling ringkas.
4. Dilarang menambah dependency/library baru di luar yang tercantum di §1 tanpa izin eksplisit dari user — termasuk "hanya untuk coba-coba".
5. **Default dari generator/tooling (create-next-app, dsb) tidak dianggap sebagai izin.** Kalau generator menghasilkan sesuatu yang berbeda dari §1 (versi library, struktur config, dll), berhenti dan laporkan perbedaannya ke user dulu — jangan lanjut jalan dengan asumsi "ini kan default resminya".
6. **Setiap laporan progress WAJIB mencantumkan SEMUA file yang diedit dalam sesi itu**, termasuk edit kecil atau yang tidak secara langsung diminta. Tidak ada edit "tersembunyi" — kalau user menemukan ada perubahan file yang tidak disebut di laporan, itu pelanggaran kepercayaan yang serius.
7. **Saat menambah dependency baru (termasuk devDependency yang boleh ditambahkan otomatis), WAJIB cek kompatibilitas versi dengan dependency terkait yang sudah ada** (contoh: versi plugin harus cocok dengan versi tool intinya — `@vitejs/plugin-react` harus cocok dengan `vite` yang terpasang). Jangan `pnpm add` tanpa versi eksplisit kalau ada risiko konflik — cek dulu, pin versi yang kompatibel.
8. **Versi major setiap framework inti (Next.js, NestJS, Prisma, dll) yang ter-scaffold WAJIB dilaporkan dan dicatat eksplisit di §1** — bukan cuma nama frameworknya. Kalau generator menghasilkan versi yang lebih baru dari yang terakhir dikonfirmasi, laporkan sebagai bagian dari ringkasan sprint, jangan biarkan tersembunyi di build log.
9. **Bukti verifikasi WAJIB ditempel langsung di chat, apa adanya.** Output test/build/curl: teks mentah tertempel, bukan "bisa dilihat di rekam jejak sistem" atau "jalankan sendiri untuk melihat hasilnya". Kalau ada tool yang gagal mengambil bukti, laporkan kegagalannya secara eksplisit — jangan diam-diam diganti klaim prosa tanpa bukti.
10. **Dilarang kata "dll" atau "dan lainnya" di daftar disclosure file (§0.6).** Setiap file yang tersentuh harus disebut namanya satu per satu, tanpa kecuali — kalau daftarnya panjang, itu tidak apa-apa, tapi tidak boleh disingkat.
11. **Dilarang memakai `browser_subagent` untuk screenshot verifikasi.** Terbukti tidak reliable (timeout CDP, screenshot tersimpan sebagai path lokal yang tidak bisa dibuka user) dan boros token. Verifikasi visual dilakukan user secara manual dari instruksi yang diberikan terpisah — Antigravity fokus ke bukti berbasis teks (test output, curl, query database, isi file).

---

## 1. Stack yang Terkunci

Jangan mengganti, menambah alternatif, atau "upgrade diam-diam" apapun di bawah ini tanpa izin.

| Layer | Teknologi |
|---|---|
| Bahasa | TypeScript (strict mode wajib aktif, `any` dilarang kecuali dikomentari alasannya) |
| Runtime | Node.js (versi LTS aktif) |
| Package manager | pnpm |
| Monorepo tool | Turborepo |
| Backend framework | NestJS |
| ORM | Prisma |
| Auth | Custom (argon2 untuk hashing, JWT/session cookie — implementasi JWT pakai `jsonwebtoken` langsung, BUKAN `@nestjs/passport`/`passport-jwt`, sesuai keputusan "Custom" di stack ini) |
| Request context propagation | `nestjs-cls` — wrapper `AsyncLocalStorage` untuk NestJS, dipakai untuk propagasi `tenantId` (§3) |
| Validasi DTO | `class-validator` + `class-transformer` — standar NestJS untuk validasi request body |
| Frontend framework | Next.js (App Router), **React 19** — `@types/react` dan `@types/react-dom` WAJIB dipin ke versi 19 yang sesuai (bukan 18) di seluruh monorepo untuk menghindari konflik tipe |
| Styling | Tailwind CSS **v4** (CSS-based `@theme` di `globals.css`, bukan `tailwind.config.js`) |
| Ikon | lucide-react — **tidak ada pengecualian** |
| Komponen UI | Custom, dibangun sendiri di `packages/ui`. Untuk komponen sederhana (button, badge, card, input) full custom di atas Tailwind. Untuk komponen dengan kompleksitas aksesibilitas (modal, dropdown, combobox, tooltip) dibangun custom-styled di atas **Radix UI primitives** (unstyled) — bukan pakai preset shadcn |
| Component variant utility | class-variance-authority (CVA) — untuk mengelola variant/state komponen di `packages/ui` |
| Rich text editor | TipTap (`@tiptap/react` + `@tiptap/starter-kit`) — headless, konsisten dengan filosofi Radix unstyled yang sudah dipakai di project ini |
| HTML sanitization | `xss` (BUKAN `sanitize-html` — lihat §14 Log Perubahan) — whitelist ketat: `p`, `br`, `strong`, `em`, `ul`, `ol`, `li` saja, tanpa atribut apapun |
| Searchable combobox | `cmdk` — dipasangkan dengan Radix Popover, konsisten dengan filosofi unstyled primitive yang sudah dipakai untuk Modal/Dropdown/Tooltip |
| Database | MySQL 8 |
| File storage | **VPS local filesystem** (bukan Cloudflare R2 — lihat §14 Log Perubahan untuk alasan). Gambar WAJIB auto-compress + convert ke WebP sebelum disimpan, pakai `sharp`. Disimpan di `apps/api/storage/uploads/`, diserve lewat NestJS static route di `/api/uploads/*` |
| Cache / Queue | Redis + BullMQ |
| Web server / TLS | Caddy |
| CDN/DNS | Cloudflare |
| Unit/integration test | Vitest (`apps/web`, `packages/ui`). **Pengecualian resmi:** `apps/api` (NestJS) pakai **Jest** — default scaffold NestJS yang didukung resmi dan terintegrasi erat dengan testing utilities Nest; migrasi paksa ke Vitest di NestJS butuh tooling komunitas yang kurang matang, tidak sepadan risikonya |
| E2E test | Playwright |

---

## 2. Struktur Project (Monorepo)

```
umrolink/
├── apps/
│   ├── api/          # NestJS — semua business logic & endpoint
│   └── web/           # Next.js — dashboard admin/agen + web publik tenant
├── packages/
│   ├── types/          # TypeScript types/interfaces yang dipakai bersama api & web
│   ├── ui/              # Komponen UI custom (button, modal, dropdown, dll) — SATU sumber, dipakai dashboard & web publik
│   └── config/         # eslint, tsconfig, prettier config bersama
├── prisma/
│   └── schema.prisma   # satu schema, dipakai oleh apps/api
└── AGENTS.md, PRD.md, sprint_plan.md, color_system.md
```

**Catatan soal `prisma/seed.ts`:** file seed HARUS berada di `apps/api/prisma/seed.ts` (bukan di `prisma/` root) — pnpm workspace tidak melakukan hoist dependency yang di-scope ke satu package (misal `argon2` yang cuma terpasang di `apps/api`), jadi script apapun yang butuh dependency itu harus dieksekusi dari lokasi yang bisa me-resolve `node_modules` package tersebut. Konfigurasi `"prisma": { "seed": ... }` di `apps/api/package.json` mengikuti lokasi ini.

Jangan buat struktur folder alternatif (misal API routes langsung di dalam Next.js) — pemisahan `api` dan `web` ini final karena alasan isolasi domain logic dan supaya dashboard maupun web publik sama-sama konsumen dari satu sumber kebenaran (NestJS API).

---

## 3. Multi-Tenancy — ATURAN PALING KRITIS

Ini bagian paling sering jadi sumber bug fatal (data satu tenant bocor ke tenant lain). Ikuti pola ini persis:

1. **Resolusi tenant** terjadi di satu middleware/guard di titik masuk request (`apps/api`), berdasarkan subdomain atau custom domain. Hasilnya (`tenantId`) disimpan lewat `AsyncLocalStorage`, bukan diteruskan manual sebagai parameter ke tiap fungsi.
2. **Semua akses Prisma ke model yang tenant-scoped WAJIB lewat Prisma Client Extension** yang otomatis menyuntik `where: { tenantId }` berdasarkan nilai di `AsyncLocalStorage`. Dilarang memanggil `prisma.<model>.findMany()` dkk langsung dari client global tanpa extension ini.
3. **Dilarang keras** memakai `$queryRaw` / `$executeRaw` untuk model tenant-scoped kecuali menyertakan filter `tenantId` secara eksplisit dan direview khusus oleh user.
4. Setiap model Prisma yang tenant-scoped harus punya field `tenantId` dan didaftarkan di daftar "tenant-scoped models" di dalam extension — model yang lupa didaftarkan berarti TIDAK terlindungi otomatis, jadi daftar ini harus selalu sinkron dengan schema.
5. **Definition of Done untuk fitur apapun yang menyentuh data tenant:** ada test otomatis yang membuktikan user tenant A tidak bisa membaca/mengubah data tenant B — bukan cukup "sudah dicoba manual sekali".
6. Login/auth guard wajib menolak jika `tenantId` di token/session pengguna tidak cocok dengan tenant yang teresolusi dari domain saat itu.
7. **Catatan untuk Sprint 13 (hardening):** resolusi tenant memprioritaskan header `x-forwarded-host` (fallback ke `Host`) — ini benar untuk kebutuhan internal fetch server-side Next.js→NestJS, TAPI sebelum production harus dipastikan Caddy tidak meneruskan `x-forwarded-host` mentah dari client eksternal apa adanya (harus di-strip/di-override di layer proxy), supaya tidak bisa dipakai orang luar untuk memalsukan tenant context langsung ke API.

---

## 4. Auth & Role

- Tiga role: `super_admin`, `travel_admin`, `agent`. Role check di level guard/decorator NestJS, bukan di-check manual di dalam controller.
- Password di-hash dengan argon2 — jangan pakai bcrypt atau lainnya.
- Endpoint publik (registrasi agen, form booking) harus eksplisit ditandai `@Public()` — default semua endpoint butuh autentikasi. Kesalahan sebaliknya (endpoint privat ter-expose publik karena lupa guard) adalah kelas bug yang harus dihindari lewat default aman ini.

---

## 5. Design System & Styling

- Semua warna WAJIB lewat token Tailwind yang didefinisikan sesuai `color_system.md` — dilarang hardcode hex code di komponen.
- Brand color tenant (primary/secondary/accent) di-inject sebagai CSS variable di layout web publik, fallback ke default Umrolink kalau tenant belum set. **Ini satu-satunya pengecualian yang sah** untuk styling dinamis di luar token statis.
- Warna neutral, semantic, dan status TETAP FIXED di semua tempat termasuk web publik tenant — tidak ikut dikustomisasi.
- **Dilarang memakai inline style (`style={{}}`)** kecuali untuk kasus brand color injection di atas.
- **Dilarang memakai arbitrary value Tailwind** (`w-[123px]`, `text-[15px]`, `bg-[#fff]`, `p-[7px]`, dst) di luar skala yang sudah ada di `tailwind.config`. Kalau nilai yang dibutuhkan memang belum ada di skala, tambahkan sebagai token baru di config (bukan tempel langsung di komponen) — dan kalau itu berarti keputusan skala baru, tanyakan ke user dulu.
- Styling apapun (kombinasi className, pattern spacing, dll) yang dipakai lebih dari satu tempat **wajib** jadi bagian dari komponen di `packages/ui` (lihat §7) — bukan diulang manual di tiap halaman.
- **Definition of Done untuk review kode:** ditemukan hex code, inline style, atau arbitrary value Tailwind di luar pengecualian di atas → otomatis dikembalikan untuk revisi, tidak dianggap selesai walau secara fungsional sudah jalan.

---

## 6. Responsive Design & Typography Scale

- Breakpoint mengikuti default Tailwind: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px). Dilarang bikin breakpoint custom tanpa izin.
- Dashboard: di bawah `md`, sidebar WAJIB collapse jadi hamburger menu (overlay/drawer), bukan tetap full-width menyita layar.
- Tabel dengan banyak kolom: di bawah `md`, WAJIB beralih ke layout kartu/stacked (satu baris data = satu card), bukan horizontal-scroll dipaksakan atau teks kepotong.
- Setiap halaman baru WAJIB dicek minimal di 3 lebar viewport sebelum sprint dianggap selesai: 375px (mobile), 768px (tablet), 1280px (desktop).
- **Definition of Done:** ditemukan halaman yang cuma pantas di desktop (tidak dicek mobile) → dikembalikan untuk revisi.

**Skala Typography** (baru — `color_system.md` Bagian 11 cuma mengatur warna teks, bukan ukuran):

| Peran | Mobile (default) | Desktop (`md:`) | Line-height |
|---|---|---|---|
| H1 | `text-2xl` (24px) | `md:text-4xl` (36px) | `leading-tight` |
| H2 | `text-xl` (20px) | `md:text-2xl` (24px) | `leading-tight` |
| H3 | `text-lg` (18px) | `md:text-xl` (20px) | `leading-snug` |
| Body | `text-base` (16px) | tidak scaling | `leading-normal` |
| Caption/Small | `text-sm` (14px) | tidak scaling | `leading-normal` |

Token warna teks tetap merujuk `color_system.md` Bagian 11 (tidak berubah) — tabel ini menambahkan dimensi ukuran yang sebelumnya belum ada di sana.

---

## 7. Komponen UI Custom

- **Satu komponen, satu tempat.** Semua komponen UI (button, modal, dropdown, table, form field, dll) hidup di `packages/ui` dan dipakai ulang — dilarang membuat versi lokal/one-off di dalam halaman tertentu di `apps/web` "karena lebih cepat".
- Sebelum membuat komponen baru, cek dulu apakah sudah ada varian yang mirip di `packages/ui`. Kalau ada tapi kurang fleksibel, perluas komponen yang ada (lewat props), jangan duplikasi.
- Komponen dengan kebutuhan aksesibilitas (modal, dropdown, combobox, tooltip, popover) **wajib** dibangun di atas Radix UI primitives — dilarang implementasi focus trap/keyboard nav manual dari nol.
- Setiap komponen baru di `packages/ui` butuh contoh penggunaan minimal (Storybook opsional, tapi minimal komentar/contoh di file) supaya konsisten dipakai di seluruh aplikasi, tidak berkembang jadi varian-varian liar per halaman.
- **Lebar konten dashboard WAJIB konsisten di semua halaman `/dashboard/*`** — satu komponen wrapper (`PageContainer` atau nama serupa) yang menentukan max-width dan padding horizontal, dipakai ulang di setiap halaman. Dilarang tiap halaman mengatur lebar/padding sendiri-sendiri secara manual. Referensi nilai yang benar: implementasi halaman Manajemen Paket (Sprint 3).

## 8. Ikon

- **lucide-react, titik.** Tidak membangun custom SVG icon component, tidak mencampur dengan library ikon lain, walau "cuma untuk satu ikon yang tidak ada di lucide". Kalau ikon yang dibutuhkan benar-benar tidak tersedia, laporkan ke user dulu sebelum cari solusi sendiri.

---

## 9. Upload & File Storage

- Semua file (foto paket, dokumen jamaah, dll) disimpan di filesystem VPS, folder `apps/api/storage/uploads/` — WAJIB masuk `.gitignore`, jangan pernah di-commit isi filenya.
- Struktur folder per jenis: `apps/api/storage/uploads/packages/{packageId}/`, dst — jangan campur semua file di satu folder datar.
- Gambar WAJIB diproses sebelum disimpan (pakai `sharp`): auto-compress + convert ke **WebP**, apapun format aslinya (JPEG/PNG/dst). Jangan simpan file asli mentah dari user.
- Batas ukuran file upload: **20MB** per file — ini jaring pengaman teknis (cegah disk penuh/crash dari satu upload), bukan pembatasan fitur. Tolak dengan pesan jelas kalau melebihi, jangan crash.
- Upload flow: klien kirim `multipart/form-data` langsung ke endpoint `apps/api` (pakai `FileInterceptor` dari `@nestjs/platform-express` + `multer`), `apps/api` proses (compress/convert) lalu simpan ke disk, response berisi URL relatif (`/api/uploads/...`) yang disimpan di database.
- File diserve lewat static route NestJS di path `/api/uploads/*` — supaya otomatis lewat proxy Apache/Caddy yang sudah ada untuk `/api/`, tidak perlu config reverse proxy tambahan.

---

## 10. Testing

- Unit & integration test pakai Vitest, E2E pakai Playwright.
- **Test database harus terpisah total dari database development.** `DATABASE_URL` untuk environment test wajib mengandung suffix `_test` — buat guard/script yang menolak menjalankan test kalau `DATABASE_URL` tidak memenuhi ini. Ini bukan saran, ini pencegahan terhadap kelas insiden yang bisa menghapus data development secara tidak sengaja.
- **Implementasi konkret (terbukti bekerja sejak Sprint 1):** `.env` (dev) menunjuk ke `umrolink_dev`, `.env.test` terpisah menunjuk ke `umrolink_test`. Script `test` di root `package.json` WAJIB load `.env.test` lewat `dotenv-cli` SEBELUM `check-db-url.js` dan `turbo run test` dijalankan — jangan pernah andalkan `.env` default untuk test run.
- Setup database awal (create database `umrolink_dev` & `umrolink_test`) pakai `scripts/setup-db.js`, didaftarkan sebagai `pnpm run setup:db` — didokumentasikan di README untuk onboarding developer baru.
- Migration ke test database dijalankan otomatis sebelum test run (`prisma migrate reset` khusus ke test DB), tidak pernah menyentuh DB development atau production.
- Setiap fitur multi-tenant baru wajib punya test isolasi tenant (lihat §3.5).

---

## 11. Git & Workflow

- **Antigravity TIDAK PERNAH melakukan merge ke branch `main`.** Semua pekerjaan ada di feature branch (`feature/nama-fitur` atau `sprint-N/nama-fitur`), lalu buka PR. Merge ke `main` hanya dilakukan user secara manual setelah verifikasi selesai.
- Commit message jelas dan deskriptif — bukan "fix", "update", "wip".
- Sebelum melapor sebuah sprint/task selesai, sertakan checklist: apa yang dikerjakan, bagaimana cara user mem-verifikasi manual, dan test otomatis apa yang sudah ditambahkan.

---

## 12. Environment & Secrets

- Tidak pernah commit file `.env` — hanya `.env.example` dengan placeholder.
- Semua kredensial (DB, R2, JWT secret) lewat environment variable, tidak pernah hardcode di kode.

---

## 13. Kalau Ragu

Urutan eskalasi ketika menemui situasi yang tidak tercakup dokumen ini:
1. Cek `PRD.md` — apakah ini soal requirement produk?
2. Cek dokumen ini — apakah ini soal konvensi teknis?
3. Kalau masih tidak jelas, **berhenti dan tanya user** — jangan menebak lalu lanjut jalan.

---

## 14. Log Perubahan & Keputusan

| Tanggal | Perubahan | Konteks |
|---|---|---|
| 2026-08-04 | Tailwind dikunci ke **v4**, CVA ditambahkan ke stack resmi (§1) | Sprint 0: Antigravity sempat memakai keduanya tanpa izin eksplisit (melanggar §0.4). Setelah direview, keduanya disetujui dan dikunci resmi — bukan berarti keputusan sepihak semacam ini boleh diulang tanpa lapor dulu. Ditambahkan §0.5 sebagai penguat: default generator/tooling tidak dianggap izin. |
| 2026-08-04 | React 19 dikunci resmi; ditambahkan §0.6 (disclosure edit lengkap) dan §0.7 (pin versi dependency) | Sprint 0: ditemukan React 19 terpasang tanpa dikonfirmasi (default generator, sama seperti kasus Tailwind v4), menyebabkan konflik tipe dengan `lucide-react`. Ditemukan juga edit file yang tidak dilaporkan, dan instalasi dependency tanpa pin versi menyebabkan konflik peer dependency (`@vitejs/plugin-react` vs `vite`). |
| 2026-08-04 | Jest dikunci sebagai pengecualian resmi untuk `apps/api`; ditambahkan §0.8 (wajib catat versi major framework inti) | Sprint 0: `apps/api` ternyata pakai Jest (default NestJS) tanpa dilaporkan sebagai penyimpangan dari Vitest. Next.js 16 & Turbopack juga baru ketahuan dari build log, bukan dilaporkan proaktif. |
| 2026-08-04 | Ditambahkan §6 (Responsive Design & Typography Scale) — breakpoint, perilaku sidebar/tabel di mobile, dan skala ukuran font | Sprint 3: dashboard yang dibangun (sidebar, tabel paket) ternyata tidak responsive sama sekali di viewport mobile (sidebar full-width, teks kepotong). Belum pernah ada aturan eksplisit soal ini — `color_system.md` Bagian 11 cuma mengatur warna teks, bukan ukuran/scaling. |
| 2026-08-04 | File storage diganti dari **Cloudflare R2** ke **VPS local filesystem** (§1, §9) | Sprint 3 (perluasan): kredensial R2 belum disiapkan saat fitur featured image paket dibutuhkan. Diputuskan pindah ke local storage dengan auto-compress + convert WebP (`sharp`) sebagai solusi langsung pakai, bukan mock/placeholder. Trade-off yang disadari: tidak ada CDN bawaan, disk VPS perlu dipantau manual. Bisa dievaluasi ulang ke R2 di Sprint 12 kalau diperlukan. |
| 2026-08-05 | `xss` dikunci sebagai library sanitasi HTML resmi (bukan `sanitize-html`) | Sprint 4: `sanitize-html` awalnya disetujui tapi dependency-nya (`htmlparser2` v12+) pure-ESM, bentrok dengan Jest yang default CommonJS dan tidak transform `node_modules` — error "Cannot use import statement outside a module". Sempat dicoba `esModuleInterop` (sudah aktif dari scaffold NestJS, tidak menyelesaikan masalah ini karena akar masalahnya beda: interop TS vs transform Jest). Diputuskan tidak mengutak-atik konfigurasi transform Jest secara luas demi satu library — `xss` dipakai sebagai gantinya dengan whitelist tag yang setara ketatnya. |
| 2026-08-06 | Konvensi Next.js: `apps/web/src/middleware.ts` → `apps/web/src/proxy.ts` | Sprint 6: Next.js 16 (versi terkunci kita, 16.2.12) mendeprecate file convention `middleware.ts`, diganti `proxy.ts` (export function `proxy`, bukan `middleware`). File lama tetap jalan di production build (ada legacy converter), TAPI TIDAK jalan sama sekali di `pnpm dev` — sempat bikin fitur atribusi referral terlihat "tidak berfungsi" padahal cuma soal penamaan file. Ke depan, SEMUA logic proxy/middleware (proteksi dashboard, tangkap `?ref=`, dst) hidup di satu file `apps/web/src/proxy.ts`. |

## 15. Versi Ter-resolve (per Sprint 0)

| Teknologi | Versi Terkunci |
|---|---|
| pnpm | 9.0.0 |
| Turborepo | 2.10.8 |
| TypeScript | 5.9.3 |
| Next.js | 16.2.12 (App Router, Turbopack) |
| React / React-DOM | 19.2.4 |
| NestJS | 11.1.28 |
| Tailwind CSS | 4.3.3 |
| Vitest | 1.6.1 (`apps/web`, `packages/ui`) |
| Jest | 30.4.2 (`apps/api` — pengecualian resmi) |
| Playwright | 1.62.1 |
| Prisma | Belum diinstall — dijadwalkan Sprint 1 |
