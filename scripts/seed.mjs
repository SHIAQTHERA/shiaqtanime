import crypto from "node:crypto";
import pg from "pg";
import { pgConfig } from "../lib/pgconfig.mjs";

try { process.loadEnvFile(".env"); } catch (_) {}
try { process.loadEnvFile(".env.local"); } catch (_) {}

let n = 0;
const uid = (p) => p + Date.now().toString(36) + (n++).toString(36) + crypto.randomBytes(4).toString("hex");
const hashPassword = (pw) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt$${salt}$${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
};

const adminEmail = (process.env.ADMIN_EMAIL || "shiaqtanime@admin.com").toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || (() => { throw new Error("ADMIN_PASSWORD belum diatur di .env"); })();

const client = new pg.Client(pgConfig());
await client.connect();
try {
  await client.query("BEGIN");

  // Admin: dibuat jika belum ada, kredensial diperbarui jika sudah ada
  const ex = await client.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
  if (ex.rows[0]) {
    await client.query("UPDATE users SET email = $1, password_hash = $2 WHERE id = $3", [adminEmail, hashPassword(adminPassword), ex.rows[0].id]);
  } else {
    await client.query("INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES ($1,$2,$3,$4,'ADMIN',$5)",
      [uid("u"), "Administrator", adminEmail, hashPassword(adminPassword), Date.now()]);
  }

  const existing = await client.query("SELECT COUNT(*)::int AS c FROM anime");
  if (existing.rows[0].c === 0) {
    const genreNames = [["Action","action"],["Adventure","adventure"],["Comedy","comedy"],["Drama","drama"],["Fantasy","fantasy"],["Sci-Fi","sci-fi"],["Romance","romance"],["Slice of Life","slice-of-life"]];
    const gid = {};
    for (const [name, slug] of genreNames) {
      const id = uid("g"); gid[name] = id;
      await client.query("INSERT INTO genres (id, name, slug) VALUES ($1,$2,$3) ON CONFLICT (slug) DO NOTHING", [id, name, slug]);
    }
    const g = await client.query("SELECT id, name FROM genres");
    for (const r of g.rows) gid[r.name] = r.id;

    const t0 = Date.now() - 100000;
    const samples = [
      { slug:"blue-orbit", title:"Blue Orbit", alternative:"Ao no Kiseki", synopsis:"Seorang penjelajah muda memulai perjalanan melintasi pulau-pulau misterius untuk mencari jawaban tentang masa lalunya.", releaseYear:2025, status:"ONGOING", airDay:"Sabtu", rating:"8.4", featured:true, genres:["Adventure","Fantasy"], episodes:3 },
      { slug:"neon-echo", title:"Neon Echo", alternative:"Neon no Hibiki", synopsis:"Di kota futuristik, seorang teknisi menemukan sinyal yang dapat mengubah masa depan umat manusia.", releaseYear:2025, status:"ONGOING", airDay:"Minggu", rating:"8.1", featured:true, genres:["Sci-Fi","Action"], episodes:2 },
      { slug:"summer-letter", title:"Summer Letter", alternative:null, synopsis:"Persahabatan, keluarga, dan surat-surat lama membawa sekelompok remaja menemukan arti rumah.", releaseYear:2024, status:"COMPLETED", rating:"8.7", featured:false, genres:["Drama","Slice of Life"], episodes:4 },
      { slug:"starlight-odyssey-movie", title:"Starlight Odyssey: The Movie", alternative:null, synopsis:"Movie layar lebar petualangan antariksa: sebuah awak kapal kecil menempuh galaksi demi menyelamatkan rumah mereka.", releaseYear:2025, status:"COMPLETED", rating:"8.9", featured:false, genres:["Sci-Fi","Adventure"], episodes:1, type:"MOVIE", price:5000 }
    ];
    let i = 0;
    for (const s of samples) {
      const id = uid("a"), ts = t0 + i++ * 1000;
      await client.query(
        `INSERT INTO anime (id, slug, title, alternative, synopsis, release_year, status, air_day, type, price, rating, featured, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)`,
        [id, s.slug, s.title, s.alternative, s.synopsis, s.releaseYear, s.status, s.airDay || null, s.type || "TV", s.price || null, s.rating, s.featured, ts]);
      for (const gn of s.genres) await client.query("INSERT INTO anime_genres (anime_id, genre_id) VALUES ($1,$2)", [id, gid[gn]]);
      for (let k = 1; k <= s.episodes; k++) {
        await client.query("INSERT INTO episodes (id, anime_id, number, title, synopsis, sources, created_at) VALUES ($1,$2,$3,$4,$5,'[]'::jsonb,$6)",
          [uid("e"), id, k, s.type === "MOVIE" ? "Movie" : "Episode " + k, "Episode contoh. Tambahkan sumber video resmi yang memiliki izin tayang melalui dashboard admin.", ts]);
      }
    }
  }

  await client.query(
    `INSERT INTO settings (key, value) VALUES
       ('payment', '{"method":"","qrisUrl":"","instructions":"","whatsapp":""}'::jsonb),
       ('saweria', '""'::jsonb),
       ('extLink', '{"label":"","url":""}'::jsonb)
     ON CONFLICT (key) DO NOTHING`);

  await client.query("COMMIT");
  console.log("Seed selesai. Admin:", adminEmail);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  await client.end();
}
