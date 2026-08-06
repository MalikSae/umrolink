# UMROLINK.COM — Color System
Versi 1.0 — Juli 2026
Status: Final

> Dokumen ini adalah **satu-satunya sumber kebenaran warna** untuk project Umrolink. Nilai di sini WAJIB dipakai apa adanya di `tailwind.config.js` sebagai token — dilarang hardcode di tempat lain (lihat `AGENTS.md` Bagian 6).

> **PENTING — Dua tingkat sistem warna.** Dokumen ini berlaku PENUH untuk: branding Umrolink sendiri, dashboard Admin (Super Admin), dashboard Travel, dan dashboard Agen. Untuk **web publik tenant** (landing, detail paket, form daftar, status booking), warna brand (`primary`/`secondary`/`accent`) BOLEH dikustomisasi per travel — lihat Bagian 15. Warna neutral, semantic, status, dan chart TETAP FIXED dari dokumen ini di mana pun, termasuk di web publik — lihat Bagian 15 untuk alasannya.

---

## 1. Prinsip Warna

- **Trust** — Navy sebagai warna pendukung untuk area yang menangani data sensitif (booking, pembayaran, komisi).
- **Growth** — Hijau (Emerald) sebagai identitas utama: pertumbuhan, keberkahan, kepercayaan.
- **Simplicity** — Background netral, konten jadi fokus.
- **Clarity** — Setiap status punya warna konsisten, dikombinasikan dengan icon/badge/label (bukan warna saja) sesuai WCAG.

---

## 2. Brand Colors — Umrolink & Dashboard (FIXED, bukan untuk web publik tenant)

Warna ini adalah identitas Umrolink sendiri. Dipakai di: branding platform, dashboard Super Admin, dashboard Travel, dashboard Agen. **TIDAK dipakai** di web publik tenant kecuali travel belum set warna sendiri (jadi default — lihat Bagian 15).

| Token | Hex | Dipakai untuk |
|---|---|---|
| `primary` | `#059669` | Logo, primary button, active menu, CTA, progress |
| `primary-hover` | `#047857` | Hover state primary |
| `secondary` | `#1E3A5F` | Header/nav bar terang, branding sekunder |
| `accent` | `#0EA5A4` | Highlight, chart aksen, informational card |

---

## 3. Neutral Scale (WAJIB skala penuh — presisi ke Tailwind `slate`)

| Token | Hex | Padanan | Dipakai untuk |
|---|---|---|---|
| `neutral-50` | `#F8FAFC` | slate-50 | Background halaman |
| `neutral-100` | `#F1F5F9` | slate-100 | Divider |
| `neutral-200` | `#E2E8F0` | slate-200 | Border (disatukan, lihat poin 3 di atas) |
| `neutral-300` | `#CBD5E1` | slate-300 | Disabled state, sidebar icon |
| `neutral-400` | `#94A3B8` | slate-400 | **Ikon/placeholder saja — JANGAN untuk teks berbaca** |
| `neutral-500` | `#64748B` | slate-500 | **Muted/caption text yang benar-benar dibaca** (kontras AA) |
| `neutral-600` | `#475569` | slate-600 | Body text |
| `neutral-700` | `#334155` | slate-700 | — |
| `neutral-800` | `#1E293B` | slate-800 | Sidebar hover |
| `neutral-900` | `#0F172A` | slate-900 | Heading text, sidebar background |
| `surface` | `#FFFFFF` | white | Card, modal, permukaan konten |

**Implementasi teknis:** karena skala ini sama persis dengan Tailwind `slate` bawaan, cukup:
```js
import colors from 'tailwindcss/colors';
// di theme.extend.colors:
neutral: colors.slate,
```
Tidak perlu hardcode 10 hex manual — mengurangi risiko salah ketik.

---

## 4. Semantic Colors

| Token | Hex | Dipakai untuk |
|---|---|---|
| `success` | `#22C55E` | Berhasil, Lunas, Dibayar, Berangkat |
| `warning` | `#F59E0B` | Pending, Menunggu, DP, Verifikasi |
| `danger` | `#EF4444` | Batal, Error, Hapus, Ditolak |
| `info` | `#3B82F6` | Informasi, Booking, Progress |

**Alert background/border** (Success/Warning/Danger/Info) **diturunkan dari token di atas via opacity Tailwind, bukan hex terpisah:**
```jsx
<div className="bg-success/10 border border-success text-success">...</div>
```

---

## 5. Status Booking (harus sinkron dengan enum `BookingStatus` di `AGENTS.md`)

| Status (enum) | Label | Token warna |
|---|---|---|
| `lead` | Lead | `#6366F1` (indigo, khusus status ini — belum ada di semantic lain) |
| `booking` | Booking | `info` `#3B82F6` |
| `dp_confirmed` | DP Dikonfirmasi | `warning` `#F59E0B` |
| `paid` | Lunas | `success` `#22C55E` |
| `departed` | Berangkat | `primary` `#059669` |
| `cancelled` | Batal | `danger` `#EF4444` |

## 6. Status Komisi (harus sinkron dengan enum `CommissionStatus` di `AGENTS.md`)

| Status (enum) | Label | Token warna |
|---|---|---|
| `pending` | Pending | `warning` `#F59E0B` |
| `payable` | Siap Dibayar | `info` `#3B82F6` |
| `paid` | Dibayar | `success` `#22C55E` |
| `cancelled` | Dibatalkan | `danger` `#EF4444` |

> Implementasi: komponen `StatusBadge` (lihat `AGENTS.md` Bagian 6) memakai tabel ini sebagai satu-satunya sumber mapping warna — jangan didefinisikan ulang di komponen lain.

---

## 6a. Status Paket (harus sinkron dengan enum `PackageStatus` di `AGENTS.md`)

| Status (enum) | Label | Token warna |
|---|---|---|
| `draft` | Draft | `neutral-400` (belum tampil, netral) |
| `open` | Open | `success` `#22C55E` (aktif, bisa didaftar) |
| `full` | Full | `warning` `#F59E0B` (perlu perhatian, kuota habis) |
| `finished` | Selesai | `primary` `#059669` (selaras dengan status Berangkat di Status Booking) |

## 6b. Status Agen (harus sinkron dengan enum `AgentStatus` di `AGENTS.md`)

| Status (enum) | Label | Token warna |
|---|---|---|
| `pending` | Menunggu Persetujuan | `warning` `#F59E0B` |
| `active` | Aktif | `success` `#22C55E` |
| `inactive` | Nonaktif | `neutral-400` |

---

## 7. KPI Colors (dashboard, stat card)

Sengaja **reuse** warna status/semantic yang relevan supaya ada asosiasi visual (mis. KPI Booking = biru = sama dengan status Booking):

| Token | Hex | Dipakai untuk |
|---|---|---|
| `kpi-booking` | `#3B82F6` | Kartu statistik booking |
| `kpi-revenue` | `#059669` | Kartu statistik revenue |
| `kpi-commission` | `#8B5CF6` | Kartu statistik komisi |
| `kpi-agent` | `#F97316` | Kartu statistik agen |
| `kpi-travel` | `#1E3A5F` | Kartu statistik travel (khusus panel Super Admin) |
| `kpi-pilgrim` | `#06B6D4` | Kartu statistik jamaah |

---

## 8. Chart Palette (dataviz multi-series)

**Sengaja dibuat terpisah dari warna status/semantic** — kalau warna chart sama dengan warna status, pengguna bisa salah asosiasi saat keduanya tampil berdampingan di dashboard yang sama.

```
chart-1: #059669
chart-2: #2563EB
chart-3: #F59E0B
chart-4: #8B5CF6
chart-5: #06B6D4
```
Maksimal 5 warna dalam satu grafik.

---

## 9. Sidebar

| Elemen | Token | Hex |
|---|---|---|
| Background | `neutral-900` | `#0F172A` |
| Hover | `neutral-800` | `#1E293B` |
| Active | `primary` | `#059669` |
| Icon | `neutral-300` | `#CBD5E1` |
| Text | `neutral-50` | `#F8FAFC` |

---

## 10. Buttons

| Varian | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary | `primary` | White | — | `primary-hover` |
| Secondary | `surface` (white) | `neutral-900` | `neutral-200` | — |
| Danger | `danger` | White | — | — |
| Ghost | Transparent | Mengikuti warna konteks | — | — |
| Outline | Transparent | `primary` | `primary` | `bg-primary/5` |

---

## 11. Typography Color

| Peran | Token | Hex |
|---|---|---|
| Heading | `neutral-900` | `#0F172A` |
| Body | `neutral-600` | `#475569` |
| Caption/Muted (teks yang dibaca) | `neutral-500` | `#64748B` |
| Disabled | `neutral-300` | `#CBD5E1` |
| Ikon/placeholder (bukan teks baca) | `neutral-400` | `#94A3B8` |

---

## 12. Aksesibilitas

- Target kontras minimum WCAG AA: teks kecil 4.5:1, teks besar 3:1. **Sudah diverifikasi ulang** untuk kombinasi teks-di-atas-putih yang dipakai di dokumen ini (lihat poin 1 di Ringkasan Perubahan).
- Jangan gunakan warna sebagai satu-satunya indikator status — selalu kombinasikan dengan icon (lihat `AGENTS.md` Bagian 7 — Icon Assets), badge, atau label.
- Area `Public` dan `Agent` (dominan mobile, sering dipakai di luar ruangan) — hindari kombinasi warna dengan kontras rendah untuk teks apa pun yang membawa informasi (harga, status, instruksi pembayaran).

---

## 13. Design Guidelines

- Warna hijau (`primary`) hanya untuk aksi utama.
- Jangan lebih dari satu warna primer dalam satu halaman.
- Background selalu warna netral (`neutral-50`/`surface`).
- Hindari gradient berlebihan.
- Gunakan whitespace agar dashboard tetap mudah dibaca.
- Status selalu pakai semantic color yang konsisten sesuai tabel Bagian 5 & 6.

---

## 14. Future Extension (di luar scope MVP)

- Dark Mode
- Mobile App
- Branding Enterprise (paket white-label penuh dengan logo custom di email, dsb — di luar sekadar warna)

---

## 15. Tenant Brand Colors — Kustomisasi Warna Web Publik per Travel

**Status: MVP (masuk scope, bukan future extension).** Setiap travel bisa mengatur warna brand sendiri untuk **web publik** mereka (landing, detail paket, form daftar, halaman status booking), supaya tidak terlihat generik/seragam antar travel.

### 15.1 Yang Bisa Dikustomisasi

| Token | Default (jika travel belum set) | Dipakai untuk |
|---|---|---|
| `tenant-primary` | `primary` Umrolink (`#059669`) | CTA button ("Daftar Sekarang"), highlight, active state |
| `tenant-secondary` | `secondary` Umrolink (`#1E3A5F`) | Header/hero background, elemen sekunder |
| `tenant-accent` | `accent` Umrolink (`#0EA5A4`) | Highlight tambahan, badge non-status, dekorasi |

### 15.2 Yang TIDAK Bisa Dikustomisasi (tetap FIXED dari Bagian 1–13 dokumen ini)

- **Neutral scale** (background, text, border) — supaya keterbacaan terjamin di semua tenant, terutama untuk area `Public` yang wajib mobile-first (lihat `AGENTS.md` Bagian 5).
- **Semantic colors** (`success`/`warning`/`danger`/`info`) dan **Status Booking/Komisi** (Bagian 5 & 6) — dipertahankan fixed supaya makna warna konsisten di seluruh platform. Jamaah yang pernah booking di 2 travel berbeda tetap melihat "Lunas" = hijau, "Batal" = merah, di mana pun. Ini juga menjaga kontras WCAG AA yang sudah diverifikasi di dokumen ini — kalau semantic color ikut dikustomisasi bebas, jaminan aksesibilitas itu hilang.

### 15.3 Implementasi Teknis

Karena Tailwind mengompilasi class saat build (tidak bisa terima nilai dinamis tak terbatas per tenant), warna tenant diimplementasikan lewat **CSS custom property**, bukan class Tailwind statis:

1. Kolom di tabel `tenants`: `brand_primary_color`, `brand_secondary_color`, `brand_accent_color` (nullable — `NULL` berarti pakai default Umrolink di atas).
2. `PublicLayout` (dan hanya `PublicLayout` — TIDAK di layout Admin/Travel/Agent) meng-inject CSS variable di root elemen halaman:
   ```html
   <div style="--tenant-primary: {{ $tenant->brand_primary_color ?? '#059669' }};
               --tenant-secondary: {{ $tenant->brand_secondary_color ?? '#1E3A5F' }};
               --tenant-accent: {{ $tenant->brand_accent_color ?? '#0EA5A4' }};">
   ```
3. Di `tailwind.config.js`, tambahkan token yang menunjuk ke variable ini (khusus dipakai di area `Public`):
   ```js
   'tenant-primary': 'var(--tenant-primary)',
   'tenant-secondary': 'var(--tenant-secondary)',
   'tenant-accent': 'var(--tenant-accent)',
   ```
4. Komponen di area `Public` yang butuh warna brand pakai `bg-tenant-primary`, `text-tenant-secondary`, dst — BUKAN `bg-primary` biasa (itu warna Umrolink, salah konteks). Komponen `StatusBadge` di halaman status booking publik TETAP pakai token status fixed (Bagian 5/6), bukan token tenant.

### 15.4 Validasi Kontras (Wajib, Sederhana)

Saat travel menyimpan warna custom di dashboard, sistem WAJIB cek kontras dasar warna tersebut terhadap putih (`#FFFFFF`) dan terhadap `neutral-900`. Jika rasio kontras di bawah ~3:1 (ambang minimum untuk elemen non-teks seperti tombol besar), tampilkan peringatan non-blocking: *"Warna ini mungkin sulit dibaca, tetap simpan?"* — jangan mem-block simpan sepenuhnya (keputusan akhir tetap di travel), cukup beri sinyal.

### 15.5 UI Pengaturan

Color picker untuk 3 warna ini masuk ke halaman **Pengaturan Profil Travel** di dashboard travel (bagian dari Sprint 10 di `sprint_plan.md`), dengan live preview mini (contoh tombol/header) supaya travel langsung lihat efeknya sebelum simpan.

---

## 16. Responsive Design & Typography Scale

### 16.1 Breakpoint

Mengikuti default Tailwind tanpa pengecualian:

| Token | Lebar minimum |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

Dilarang mendefinisikan breakpoint custom tanpa izin eksplisit dari Malik.

### 16.2 Perilaku Wajib per Komponen

- **Dashboard sidebar**: di bawah `md`, sidebar WAJIB collapse menjadi hamburger menu (overlay/drawer), bukan tetap full-width menyita layar.
- **Tabel banyak kolom**: di bawah `md`, WAJIB beralih ke layout kartu/stacked (satu baris data = satu card), bukan horizontal-scroll dipaksakan atau teks terpotong.
- **Setiap halaman baru** WAJIB dicek minimal di 3 lebar viewport sebelum sprint dianggap selesai: **375px** (mobile), **768px** (tablet), **1280px** (desktop).
- **Definition of Done**: ditemukan halaman yang hanya layak di desktop → dikembalikan untuk revisi.

### 16.3 Typography Scale

Body dan caption sengaja **tidak** ikut scaling — hanya heading yang membesar di layar lebar, agar kepadatan konten tetap terjaga di desktop.

| Peran | Mobile (default) | Desktop (`md:`) | Line-height |
|---|---|---|---|
| H1 | `text-2xl` (24px) | `md:text-4xl` (36px) | `leading-tight` |
| H2 | `text-xl` (20px) | `md:text-2xl` (24px) | `leading-tight` |
| H3 | `text-lg` (18px) | `md:text-xl` (20px) | `leading-snug` |
| Body | `text-base` (16px) | `text-base` (tidak scaling) | `leading-normal` |
| Caption/Small | `text-sm` (14px) | `text-sm` (tidak scaling) | `leading-normal` |

Token warna teks tetap merujuk Bagian 11 (tidak berubah) — section ini hanya menambahkan dimensi ukuran yang sebelumnya belum ada.

---

© 2026 Umrolink.com — Color System Documentation v1.0
