// Konfigurasi koneksi PostgreSQL (Supabase) yang dipakai bersama oleh aplikasi dan skrip db.
// Dipisah agar server Next.js, migrate.mjs, dan seed.mjs memakai pengaturan SSL yang sama.

export function pgConfig(extra = {}) {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL belum diatur. Salin .env.example ke .env lalu isi dengan connection string Supabase.");
  }

  const url = new URL(raw);
  const host = url.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";

  // pg versi baru menganggap sslmode=require sebagai verify-full, sehingga gagal terhadap
  // sertifikat Supabase. Parameter itu dibuang dan SSL diatur eksplisit di bawah.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");

  const sslOff = process.env.DATABASE_SSL === "false" || isLocal;
  return {
    connectionString: url.toString(),
    ssl: sslOff ? false : { rejectUnauthorized: false },
    ...extra
  };
}
