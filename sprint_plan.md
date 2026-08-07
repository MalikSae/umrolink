# sprint_plan.md — Umrolink

> Roadmap eksekusi 15 sprint untuk stack Node.js/TypeScript (lihat `AGENTS.md` §1 untuk stack terkunci, `PRD.md` untuk requirement produk). Setiap sprint diverifikasi manual oleh Malik sebelum merge ke `main` — lihat `AGENTS.md` §10.

**Catatan penamaan:** file ini dinamai `sprint_plan.md` mengikuti konvensi tiga dokumen lain (`workflow.md`, `AGENTS.md`, `color_system.md`) supaya referensi silang antar dokumen konsisten.

---

## Ringkasan Status

| # | Sprint | Status | Fokus |
|---|---|---|---|
| 0 | Fondasi & Design System | **Selesai** | Monorepo, token warna, komponen standar, halaman `/design-system` |
| 1 | Multi-Tenancy Core | **Selesai** | Resolusi tenant, scoping otomatis |
| 2 | Auth & Role | **Selesai** | 3 role, blokir login lintas-tenant |
| 3 | Manajemen Paket | **Selesai** | CRUD paket, harga per tipe kamar, akomodasi, include/exclude, komisi agen, multi-tanggal keberangkatan, rich text editor (TipTap), responsive sidebar/tabel |
| 4 | Web Publik Tenant | **Selesai** | Landing, detail paket, brand color, slug SEO, sanitasi XSS, route group isolation |
| 5 | Registrasi & Approval Agen | **Selesai** | Kode agen unik per tenant |
| 6 | Atribusi Referral | **Selesai** | Cookie 30 hari, lock atribusi |
| 7 | Booking & Kuota | **Selesai** | Kuota per tanggal keberangkatan, SERIALIZABLE tx, 15 E2E scenarios |
| 8 | Komisi | Belum mulai | Auto-generate komisi, dashboard agen |
| 9 | Dashboard Travel Admin Lanjutan | Belum mulai | Kelola booking & status |
| 10 | Dashboard Agent Lanjutan | Belum mulai | Statistik referral, copy-link |
| 11 | Notifikasi | Belum mulai | Email via queue (BullMQ) |
| 12 | Upload & File Storage | Belum mulai | R2 presigned URL, kompresi gambar |
| 13 | Audit Trail & Hardening Keamanan | Belum mulai | Log perubahan status, review keamanan |
| 14 | QA & Persiapan Launch | Belum mulai | Performance, SEO check, uji menyeluruh |

*(Update kolom Status seiring progres: Belum mulai → Sedang dikerjakan → Menunggu review Malik → Selesai)*

---

## Sprint 0 — Fondasi & Design System

**Goal:** Monorepo berjalan, seluruh token warna dan komponen standar tersedia dan bisa diverifikasi secara visual sebelum sprint lain mulai memakainya.

**Scope:**
- Setup monorepo: pnpm + Turborepo, struktur `apps/api` (NestJS), `apps/web` (Next.js), `packages/types`, `packages/ui`, `packages/config` (lihat `AGENTS.md` §2)
- Prisma init dengan schema kosong/placeholder, koneksi ke MySQL
- Tailwind config di `apps/web` memakai token dari `color_system.md` — bukan nilai default Tailwind
- **Komponen standar di `packages/ui`**: Button, Input, Badge, Card, Modal, Dropdown, Tooltip, Table, Alert/Toast — sesuai aturan `AGENTS.md` §6 (custom di atas Radix untuk yang butuh aksesibilitas)
- **Halaman `/design-system`** di `apps/web`: menampilkan seluruh token warna (swatch dengan nama & hex) dan seluruh komponen standar beserta variannya (default/hover/disabled/error state) — dipakai sebagai referensi visual sekaligus alat verifikasi manual Malik bahwa implementasi token & komponen sudah sesuai `color_system.md`
- Setup Vitest + Playwright, termasuk guard `DATABASE_URL` harus mengandung `_test` untuk environment test (`AGENTS.md` §9)

**Definition of Done:**
- [ ] `pnpm dev` menjalankan `apps/api` dan `apps/web` bersamaan tanpa error
- [ ] Halaman `/design-system` menampilkan semua token warna dari `color_system.md` dan semua komponen standar dengan variannya
- [ ] Tidak ada hex hardcoded atau arbitrary Tailwind value di kode (self-check sesuai `AGENTS.md` §5)
- [ ] Test dasar (contoh: render komponen `packages/ui`) jalan lewat Vitest
- [ ] Malik memverifikasi visual `/design-system` sebelum sprint dianggap selesai

**Catatan/asumsi:** `/design-system` sebaiknya hanya aktif di environment non-production (tidak ikut ter-build ke production), supaya tidak menjadi halaman publik yang tidak perlu. Perlu konfirmasi Malik kalau ternyata mau dijadikan dokumentasi publik.

---

## Sprint 1 — Multi-Tenancy Core

**Goal:** Setiap request bisa diresolusi ke tenant yang benar, dan query database otomatis terisolasi per tenant.

**Scope:**
- Model `Tenant` di Prisma
- Middleware/guard resolusi tenant dari subdomain/custom domain di `apps/api`
- `AsyncLocalStorage` untuk propagasi `tenantId`
- Prisma Client Extension untuk auto-scoping query (`AGENTS.md` §3)

**Definition of Done:**
- [ ] Test otomatis membuktikan user tenant A tidak bisa membaca data tenant B
- [ ] Request ke domain tenant yang tidak terdaftar ditolak dengan jelas (bukan crash)

---

## Sprint 2 — Auth & Role

**Goal:** Tiga role bisa login, dan login lintas-tenant diblokir.

**Scope:**
- Model `User` dengan role (`super_admin`, `travel_admin`, `agent`) dan relasi ke tenant
- Hashing password dengan argon2, JWT/session
- Guard/decorator role-based, default semua endpoint privat kecuali ditandai `@Public()`

**Definition of Done:**
- [ ] Login dengan akun tenant A di domain tenant B ditolak (verifikasi manual, disarankan pakai Incognito seperti versi sebelumnya)
- [ ] Test otomatis untuk guard role per endpoint

---

## Sprint 3 — Manajemen Paket

**Goal:** Travel Admin bisa membuat, mengedit, dan mengelola paket secara lengkap — dari informasi dasar, konten kaya (rich text), akomodasi, fasilitas, harga, komisi agen, sampai tanggal-tanggal keberangkatan.

**Scope:**
- Halaman login di `apps/web` (form email + password) — prasyarat supaya dashboard bisa diakses lewat browser. Setelah login sukses, redirect sesuai role.
- Layout dashboard protected (cek token, redirect ke /login kalau belum login)
- **Sidebar responsive**: di bawah `md` collapse jadi hamburger/drawer; di desktop bisa collapse/expand via tombol di topbar.
- **Topbar** dengan avatar user, nama, role, dropdown logout.
- CRUD paket di `apps/api`, form di `apps/web` (dashboard Travel Admin) dengan field-field berikut:
  - **Nama Paket** (wajib, min 3 karakter)
  - **Deskripsi** — rich text editor (TipTap: `@tiptap/react` + `@tiptap/starter-kit`), toolbar: bold, italic, bullet list, numbered list
  - **Akomodasi**: Maskapai, Hotel Makkah, Hotel Madinah (masing-masing input teks)
  - **Fasilitas**: Sudah Termasuk & Tidak Termasuk — dua textarea terpisah, satu item per baris
  - **Harga**: Quad / Triple / Double (masing-masing opsional), minimal satu harus terisi untuk bisa publish
  - **Komisi Agen** per jamaah — opsional, tidak menghalangi publish
  - **Tanggal Keberangkatan** — list dinamis (tambah/hapus baris), setiap baris: tanggal + kuota; boleh kosong saat draft
- Model `PackageDeparture` di Prisma (`tenantId` didenormalisasi, onDelete: Cascade dari Package)
- Aturan publish: minimal **SATU** harga harus terisi (bukan wajib ketiganya)
- List paket menampilkan kolom jumlah tanggal keberangkatan
- Responsive: list paket di mobile tampil sebagai card/stacked layout

**Definition of Done:**
- [x] Bisa login lewat browser di `https://barokah.umrolink.test/login` dengan akun seed, redirect ke dashboard sesuai role
- [x] Akses dashboard tanpa login redirect ke `/login`, bukan error/halaman kosong
- [x] Paket dengan semua harga kosong tidak bisa dipublish; paket dengan minimal satu harga bisa dipublish
- [x] TipTap editor berjalan di form paket tanpa bundle/type error
- [x] Departure dates tersimpan dan ter-replace saat update
- [x] Sidebar collapse/expand berjalan di desktop; drawer hamburger di mobile
- [x] Test otomatis (e2e): publish-all-empty=400, publish-one-price=200, publish-three-prices=200, create-with-2-departures, update-replace-departures
- [x] `pnpm build` sukses tanpa error

---

## Sprint 4 — Web Publik Tenant & Brand Color

**Goal:** Setiap tenant punya halaman publik yang mencerminkan brand mereka sendiri dan dapat diindeks mesin pencari.

**Scope:**
- Halaman landing & detail paket di `apps/web` (SSR via Next.js App Router)
- Struktur route group `(public)` untuk isolasi warna brand agar tidak bocor ke dashboard/login
- Slug SEO-friendly untuk akses URL paket (menggantikan ID mentah)
- Sanitasi HTML (menggunakan `xss`) pada deskripsi paket
- Injeksi brand color (primary/secondary/accent) via CSS variable, fallback default Umrolink
- Meta tag dasar untuk SEO (title, description, Open Graph)

**Definition of Done:**
- [x] Dua tenant dengan warna brand berbeda menampilkan identitas visual berbeda tanpa mengubah keterbacaan
- [x] Halaman detail paket ter-render server-side (bisa diverifikasi lewat view-source, bukan hanya lewat browser dengan JS aktif)

---

## Sprint 5 — Registrasi & Approval Agen

**Goal:** Calon agen bisa mendaftar, dan Travel Admin bisa approve dengan kode agen unik ter-generate otomatis.

**Scope:**
- Form registrasi publik
- Approval flow di dashboard Travel Admin
- Generate kode agen (prefix dari nama travel) dengan composite unique constraint per tenant di Prisma

**Definition of Done:**
- [x] Dua agen didaftarkan bersamaan di tenant yang sama tidak menghasilkan kode duplikat (test concurrency)

---

## Sprint 6 — Atribusi Referral

**Goal:** Klik link agen tercatat dan menentukan atribusi booking yang dibuat dalam 30 hari berikutnya.

**Scope:**
- Cookie last-click, masa berlaku 30 hari
- Service atribusi referral, dipakai Sprint 7
- Atribusi terkunci begitu lead tercipta

**Definition of Done:**
- [x] Test otomatis: klik agen B setelah lead tercipta dari agen A tidak mengubah atribusi lead tsb

---

**Goal:** Calon jamaah bisa mendaftar; kuota ketat per tanggal keberangkatan, dihitung dari booking berstatus `confirmed` saja. Status `SOLD` memblokir pendaftaran baru. Tidak ada waitlist.

**Scope:**
- Form booking publik → lead tercipta dengan status `pending` dan atribusi terkunci; cek kuota + status `SOLD` dilakukan di titik ini
- Service confirm booking dengan `$transaction` SERIALIZABLE isolation untuk mencegah race condition overbooking
- Endpoint cancel booking (kembali buka slot kuota)
- Dashboard admin: list booking, aksi confirm, aksi cancel
- Indikator `isSold`/`isPast` di halaman publik detail paket

**Definition of Done:**
- [x] Booking baru ditolak 409 jika keberangkatan sudah SOLD (semua slot confirmed)
- [x] Booking baru ditolak 400 jika tanggal keberangkatan sudah lewat
- [x] Penolakan kuota terjadi di titik konfirmasi dengan 409, bukan 500
- [x] Race condition: dua confirm bersamaan pada kuota sisa 1 — tepat satu 200, satu 409 (assert ketat, tidak terima 500)
- [x] Cross-tenant: booking publik dan confirm ke data tenant lain → 404
- [x] Cancel membebaskan slot dan booking pengganti bisa masuk
- [x] Role agent tidak bisa akses GET /api/leads → 403
- [x] 15 skenario E2E otomatis lulus (`booking.e2e-spec.ts`)
- [x] Tenancy test tetap 3/3 setelah semua perubahan middleware (`tenancy.e2e-spec.ts`)
- [x] Debug `console.log` yang mencantumkan `DATABASE_URL` dihapus dari middleware

**Branch:** `sprint-7/booking-kuota` | **Commit terakhir:** `f36cbfb`

---

## Sprint 8 — Komisi

**Goal:** Agen mendapat komisi otomatis dan transparan untuk setiap booking confirmed dari referralnya.

**Scope:**
- Auto-generate komisi flat per jamaah saat booking confirmed
- Dashboard agen: riwayat & status komisi

**Definition of Done:**
- [ ] Komisi tidak muncul untuk booking yang belum confirmed atau batal (test otomatis)

---

## Sprint 9 — Dashboard Travel Admin Lanjutan

**Goal:** Travel Admin punya satu tempat untuk mengelola seluruh lead/booking masuk.

**Scope:**
- List booking dengan filter status (waitlist, confirmed, batal, dll)
- Aksi ubah status booking dari dashboard

---

## Sprint 10 — Dashboard Agent Lanjutan

**Goal:** Agen punya visibilitas penuh atas performa referralnya sendiri.

**Scope:**
- Copy-link referral dari dashboard
- Statistik dasar (jumlah klik, jumlah lead, jumlah booking confirmed)

---

## Sprint 11 — Notifikasi

**Goal:** Pihak terkait mendapat notifikasi otomatis di momen penting (booking masuk, booking confirmed, dll).

**Scope:**
- Queue email via BullMQ + Redis
- Template email dasar untuk konfirmasi booking

---

## Sprint 12 — Upload & File Storage

**Goal:** Foto paket dan dokumen jamaah tersimpan aman di R2 tanpa membebani server.

**Scope:**
- Presigned URL flow dari `apps/api`, upload langsung dari klien ke R2
- Kompresi gambar sebelum upload (`AGENTS.md` §8)

---

## Sprint 13 — Audit Trail & Hardening Keamanan

**Goal:** Perubahan penting tercatat, dan celah keamanan yang biasa muncul (endpoint publik ter-expose tidak sengaja, dll) sudah direview ulang.

**Scope:**
- Log perubahan status booking & komisi (siapa, kapan, dari-ke)
- Review menyeluruh semua endpoint: pastikan default privat kecuali eksplisit `@Public()`

---

## Sprint 14 — QA & Persiapan Launch

**Goal:** Platform siap dipakai tenant sungguhan.

**Scope:**
- Uji menyeluruh seluruh alur (lihat `PRD.md` §5 untuk alur bisnis utama)
- Cek performa halaman publik & hasil SEO dasar (SSR benar-benar ter-render, bukan cuma shell kosong)
- Review checklist keamanan multi-tenant sekali lagi sebelum tenant pertama onboarding

---

## Ringkasan Perubahan

| Tanggal | Perubahan |
|---|---|
| 2026-08-03 | Draft awal roadmap 15 sprint untuk stack Node.js/TypeScript |
| 2026-08-07 | Sprint 7 selesai: Booking & Kuota — 15 E2E scenarios, SERIALIZABLE tx, race condition proof, debug log security fix |
