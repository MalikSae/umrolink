# PRD.md — Umrolink

> **Status:** Draft v1
> **Sifat dokumen:** Ini adalah source of truth produk — apa yang harus ada, untuk siapa, dan kenapa. Dokumen ini sengaja tidak membahas pilihan teknologi/arsitektur; itu akan diputuskan terpisah di dokumen desain teknis setelah PRD ini disepakati.

---

## 1. Problem Statement

Agen travel umrah skala kecil-menengah di Indonesia umumnya tidak memiliki sistem digital untuk mengelola tiga hal sekaligus: (1) menampilkan paket umrah secara profesional ke calon jamaah, (2) mengelola jaringan mitra pemasaran (agen) beserta komisinya secara transparan, dan (3) melacak status booking jamaah dari lead masuk sampai lunas. Akibatnya proses ini sering berjalan manual lewat WhatsApp/spreadsheet — rawan salah catat komisi, sulit diaudit, dan tidak scalable saat jumlah agen atau jamaah bertambah.

Umrolink menyelesaikan ini dengan menyediakan platform siap pakai per travel (multi-tenant), tanpa travel perlu membangun sistem sendiri.

---

## 2. Goals

1. Travel dapat online dengan website publik yang merepresentasikan brand mereka sendiri, tanpa bantuan teknis
2. Agen dapat mendaftar, mendapat identitas referral unik, dan memantau komisinya sendiri tanpa perlu bertanya ke admin travel
3. Admin travel dapat mengelola seluruh siklus booking (dari lead sampai konfirmasi) dan komisi agen dalam satu sistem, tanpa proses manual di luar sistem
4. Data setiap travel (tenant) terisolasi penuh dari travel lain — satu pelanggaran isolasi data adalah kegagalan produk, bukan sekadar bug
5. Proses bisnis (pricing, komisi, kuota) dapat dikonfigurasi per travel tanpa mengubah kode

*(Target angka untuk tiap goal — lihat Pertanyaan Terbuka #1)*

---

## 3. Non-Goals

| Non-goal | Alasan |
|---|---|
| Struktur affiliate multi-level (MLM) | Di luar kebutuhan travel kecil-menengah; menambah kompleksitas audit dan kepatuhan tanpa manfaat jelas di tahap ini |
| Komisi berbasis persentase harga paket | Flat per jamaah lebih predictable bagi travel maupun agen, dan lebih mudah diaudit |
| Umrolink menampung dana jamaah | Pembayaran langsung ke rekening travel; Umrolink tidak ingin tunduk pada regulasi penampung dana pihak ketiga |
| Harga paket tunggal tanpa tipe kamar | Tidak sesuai praktik industri umrah, di mana harga selalu berbeda per tipe kamar (Quad/Triple/Double) |

Non-goals lain (aplikasi mobile, multi-bahasa, dsb.) belum diputuskan — lihat Pertanyaan Terbuka #2.

---

## 4. Persona

| Peran | Deskripsi | Kebutuhan utama |
|---|---|---|
| **Super Admin** | Pengelola platform Umrolink | Visibilitas & kontrol lintas seluruh tenant |
| **Travel Admin** | Pemilik/staf travel (tenant) | Kelola paket, booking, dan agen miliknya sendiri |
| **Agent** | Mitra pemasaran satu travel tertentu | Transparansi status referral & komisi miliknya |
| **Calon Jamaah** | Pengunjung publik | Informasi paket yang jelas, proses daftar yang mudah |

---

## 5. User Stories

**Travel Admin**
- Sebagai travel admin, saya ingin mengatur warna brand website publik saya, supaya website saya tidak terlihat sama seperti travel lain di platform ini
- Sebagai travel admin, saya ingin input harga paket per tipe kamar (Quad/Triple/Double), supaya penawaran saya sesuai praktik industri
- Sebagai travel admin, saya ingin kuota tiap tanggal keberangkatan otomatis dihitung dari booking yang sudah confirmed, supaya saya tidak perlu hitung manual dan tidak berisiko overbooking
- Sebagai travel admin, saya ingin form pendaftaran otomatis tertutup begitu satu tanggal keberangkatan penuh, supaya saya tidak perlu pantau dan tolak pendaftaran satu-satu secara manual
- Sebagai travel admin, saya ingin approve/reject pendaftaran agen baru, supaya saya mengontrol siapa yang boleh memasarkan paket saya

**Agent**
- Sebagai agen, saya ingin mendapat link referral unik begitu pendaftaran saya disetujui, supaya saya bisa langsung mulai memasarkan
- Sebagai agen, saya ingin melihat status komisi per jamaah yang saya referensikan, supaya saya tahu berapa yang akan saya terima dan kapan

**Calon Jamaah**
- Sebagai calon jamaah, saya ingin melihat detail paket dan harga per tipe kamar dengan jelas, supaya saya bisa membandingkan sebelum mendaftar
- Sebagai calon jamaah, saya ingin tahu dengan jelas kalau tanggal keberangkatan tertentu sudah penuh (SOLD), supaya saya bisa langsung pilih tanggal lain tanpa buang waktu isi form

**Super Admin**
- Sebagai super admin, saya ingin membuat tenant baru untuk travel yang onboarding, supaya travel bisa mulai memakai sistem
- Sebagai super admin, saya ingin memastikan tidak ada data satu tenant yang bisa diakses dari tenant lain, supaya kepercayaan seluruh travel di platform terjaga

---

## 6. Requirements

### Must-Have (P0)

**Isolasi Tenant**
- Setiap tenant memiliki data, pengguna, dan akses yang terisolasi penuh dari tenant lain
- *Acceptance criteria:* tidak ada jalur (UI maupun akses langsung) bagi pengguna satu tenant untuk melihat atau mengubah data tenant lain

**Autentikasi & Peran**
- Tiga peran: Super Admin, Travel Admin, Agent, masing-masing dengan batasan akses sesuai §4
- *Acceptance criteria:* login dengan akun satu tenant tidak bisa dipakai untuk mengakses tenant lain

**Manajemen Paket**
- Travel Admin dapat membuat/mengubah paket dengan harga terpisah per tipe kamar (Quad/Triple/Double)
- *Acceptance criteria:* paket yang belum lengkap harga per tipe kamarnya tidak bisa dipublikasikan

**Website Publik Tenant**
- Setiap tenant punya halaman publik: landing, detail paket, form pendaftaran, status booking
- Warna brand (primary/secondary/accent) dapat dikustomisasi oleh travel; fallback ke warna default Umrolink jika belum diatur
- *Acceptance criteria:* dua tenant dengan warna brand berbeda menampilkan identitas visual yang jelas berbeda, tanpa mengubah keterbacaan teks atau makna warna status

**Registrasi & Approval Agen**
- Pendaftaran agen publik lalu approval oleh Travel Admin, dengan kode agen unik per tenant
- *Acceptance criteria:* dua agen di tenant berbeda boleh punya kode yang mirip, tapi dalam satu tenant kode harus unik dan tidak bisa duplikat walau didaftarkan bersamaan

**Atribusi Referral**
- Sistem mencatat sumber referral (agen) saat pengunjung mengklik link agen, berlaku 30 hari sejak klik terakhir
- Begitu satu lead tercipta, atribusinya terkunci dan tidak berubah oleh klik referral berikutnya
- *Acceptance criteria:* lead yang dibuat dalam window 30 hari sejak klik tercatat dengan agen yang benar; setelah lead tercipta, klik dari agen lain tidak mengubah atribusi tersebut

**Booking & Kuota**
- Kuota ditetapkan per tanggal keberangkatan — satu paket dapat memiliki banyak tanggal keberangkatan, masing-masing dengan kuota sendiri
- Kuota dihitung dari jumlah booking berstatus **confirmed** untuk tanggal tersebut — booking yang belum confirmed tidak mengurangi kuota yang tersedia
- Begitu jumlah booking confirmed mencapai kuota, tanggal tersebut berstatus **SOLD** di halaman publik, dan pendaftaran untuk tanggal itu ditutup
- Tidak ada mekanisme waitlist — begitu SOLD, calon jamaah diarahkan memilih tanggal keberangkatan lain yang masih tersedia
- *Acceptance criteria:* status SOLD hanya muncul kalau jumlah booking confirmed sudah mencapai/melebihi kuota tanggal tersebut; percobaan submit form pendaftaran untuk tanggal yang SOLD ditolak oleh sistem (bukan sekadar disembunyikan di tampilan)

**Komisi**
- Komisi flat per jamaah dihitung otomatis saat booking berstatus confirmed
- Agen dapat melihat riwayat dan status komisinya sendiri
- *Acceptance criteria:* komisi tidak muncul untuk booking yang belum confirmed atau yang batal

### Nice-to-Have (P1)
Belum difinalkan — lihat Pertanyaan Terbuka #2

### Future Considerations (P2)
Belum difinalkan — lihat Pertanyaan Terbuka #2

---

## 7. Non-Functional Requirements

- **Isolasi data**: prioritas tertinggi; harus dapat diverifikasi lewat pengujian otomatis, bukan hanya asumsi desain
- **Mobile-first**: mayoritas calon jamaah mengakses website publik dari ponsel; pengalaman di layar kecil harus jadi prioritas desain, bukan penyesuaian belakangan
- **Dapat ditemukan lewat pencarian**: halaman paket adalah konten yang secara alami dicari orang di mesin pencari; ini adalah kebutuhan produk, bukan sekadar pertimbangan teknis tambahan
- **Keamanan akses**: tidak ada endpoint atau halaman yang bocor data di luar kewenangan penggunanya
- **Audit trail**: perubahan status booking dan komisi sebaiknya tercatat (siapa, kapan, perubahan apa) untuk keperluan penyelesaian sengketa antara travel dan agen

---

## 8. Success Metrics

*(Belum diisi — perlu ditentukan bersama. Contoh kandidat leading indicator: waktu onboarding tenant baru sampai website publik live, tingkat penyelesaian form booking. Contoh lagging indicator: jumlah tenant aktif, volume booking per tenant per bulan.)*

---

## 9. Open Questions

| # | Pertanyaan | Perlu dijawab oleh |
|---|---|---|
| 1 | Target angka untuk tiap Goal di §2 dan metrik di §8 | Product Owner |
| 2 | Daftar fitur P1/P2 — apa yang sengaja ditunda dari MVP | Product Owner |
| 3 | Non-goals tambahan (aplikasi mobile, multi-bahasa, dll.) — perlu dipastikan eksplisit atau dibiarkan terbuka | Product Owner |
| 4 | Siapa yang menangani sengketa komisi jika agen dan travel tidak sepakat (di luar sistem, atau perlu fitur dispute di produk?) | Product Owner |

---

## 10. Timeline Considerations

*(Belum diisi — menunggu §6 P1/P2 difinalkan dan PRD ini disepakati secara keseluruhan sebelum roadmap eksekusi disusun.)*
