# SHIAQTANIME — Next.js + React + PostgreSQL

Konversi dari `SHIAQTANIME` (satu file HTML) ke:

- **Frontend**: React 19 (komponen di `components/`), CSS asli disalin utuh ke `app/globals.css`
- **Backend**: Next.js 16 (App Router, route handler di `app/api/`)
- **Database**: PostgreSQL online di Supabase (skema di `db/schema.sql`, driver `pg`)

## Menjalankan

Butuh Node.js 20.12+ dan satu project Supabase (gratis).

**1. Buat project Supabase** di https://supabase.com/dashboard, catat password database yang Anda buat.

**2. Ambil connection string**: buka project → tombol **Connect** → tab *Connection string*.
- Jalankan di komputer/VPS: pilih **Session pooler** (port 5432).
- Deploy di Vercel/serverless: pilih **Transaction pooler** (port 6543).

(Koneksi *Direct* hanya IPv6, jadi sering gagal dari jaringan rumah — pakai pooler.)

**3. Isi `.env`**

```bash
cp .env.example .env     # lalu isi DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
```

Jika password database berisi karakter khusus (`@ : / # ?`), ubah ke bentuk URL-encoded (mis. `@` → `%40`).

**4. Install dan siapkan database**

```bash
npm install
npm run db:setup         # membuat tabel + data awal + akun admin di Supabase
npm run dev              # http://localhost:3000
```

Produksi: `npm run build && npm start`. Di Vercel, isi `DATABASE_URL`, `SESSION_SECRET`, dan (sekali saja,
saat menjalankan `db:setup` dari komputer Anda) kredensial admin sebagai Environment Variables.

Semua tabel memiliki **Row Level Security** aktif tanpa policy, sehingga tidak bisa diakses lewat Data API/kunci
anon Supabase. Aplikasi mengakses database langsung dari server Next.js, jadi kunci anon tidak dipakai dan
tidak perlu dimasukkan ke aplikasi. Data bisa dilihat di Supabase → *Table Editor*.

Akun admin dibuat dari `ADMIN_EMAIL` / `ADMIN_PASSWORD` di `.env`. Anda bisa menggantinya lewat
Dashboard Admin → Akun Admin setelah login pertama.

## Struktur

```
app/
  globals.css            CSS asli (tidak diubah)
  layout.jsx             <html>, judul, favicon
  [[...slug]]/page.jsx   semua halaman dirender oleh <App />
  api/                   backend (auth, anime, episodes, orders, settings, chat, ...)
components/
  App.jsx                router halaman
  Shell.jsx              intro, header, strip admin, footer, tombol admin, chat, toast
  modals.jsx             modal anime, sumber video, beli movie, detail AniList
  store.jsx              state data (dimuat dari /api/bootstrap) + helper API
  pages/                 Home, Browse (katalog/jadwal/musim/FAQ), Anime (detail/tonton), Account, Admin
lib/
  db.js, pgconfig.mjs, auth.js, data.js, animeInput.js, util.js   sisi server
  client.js, anilist.js, assets.js                  sisi browser
db/schema.sql            skema PostgreSQL
scripts/                 migrate.mjs, seed.mjs
```

## Perbedaan dari versi HTML (hanya yang tidak bisa dihindari)

- **Data kini di PostgreSQL (Supabase)**, bukan `localStorage`. Akun, daftar tontonan, pesanan, pengaturan, dan Ruang Ngobrol
  tersimpan di server dan tersinkron lintas perangkat. Teks FAQ nomor 7 dan catatan kecil di Ruang Ngobrol
  disesuaikan karena sebelumnya menyebut "disimpan di browser".
- **URL memakai path biasa** (`/anime/blue-orbit`) menggantikan `#/anime/blue-orbit`. Tampilan dan alur halaman sama.
- **Password** di-hash di server (scrypt) dan sesi memakai cookie `httpOnly` bertanda tangan.
- **Sumber video movie berbayar** hanya dikirim server ke admin atau pembeli yang pesanannya sudah *Lunas*
  (sebelumnya ada di browser semua orang).
- Terjemahan sinopsis ke bahasa Indonesia hanya disimpan permanen ke database bila admin yang membuka halamannya;
  pengunjung biasa tetap melihat hasil terjemahan di browser masing-masing.

AniList (jadwal, musim, segera tayang) dan terjemahan MyMemory tetap dipanggil langsung dari browser seperti semula.

## Catatan produksi

Belum ada pembatasan percobaan login/pendaftaran; tambahkan rate limiting (mis. di reverse proxy)
sebelum dipublikasikan. Atur `SESSION_SECRET` dengan string acak panjang.
