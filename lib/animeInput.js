import { query } from "./db.js";
import { httpsOk, slugify, uid, DEFAULT_PRICE } from "./util.js";

const STATUSES = ["ONGOING", "COMPLETED", "UPCOMING"];
const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

/** Validasi dan normalisasi input anime. `cur` = data lama (untuk PATCH parsial). */
export function normalizeAnime(body, cur) {
  const b = body || {};
  const has = (k) => Object.prototype.hasOwnProperty.call(b, k);
  const pick = (k, curVal) => (has(k) ? b[k] : curVal);
  const title = String(pick("title", cur?.title) ?? "").trim();
  const synopsis = String(pick("synopsis", cur?.synopsis) ?? "").trim();
  if (!title || !synopsis) return { error: "Judul dan sinopsis wajib diisi" };
  const posterUrl = String(pick("posterUrl", cur?.poster_url) ?? "").trim();
  const bannerUrl = String(pick("bannerUrl", cur?.banner_url) ?? "").trim();
  if ((posterUrl && !httpsOk(posterUrl)) || (bannerUrl && !httpsOk(bannerUrl))) return { error: "URL poster/banner harus HTTPS" };
  const rt = String(pick("rating", cur?.rating) ?? "").trim();
  if (rt && (isNaN(rt) || +rt < 0 || +rt > 10)) return { error: "Rating harus 0–10" };
  const status = pick("status", cur?.status || "ONGOING");
  if (!STATUSES.includes(status)) return { error: "Status tidak valid" };
  const type = pick("type", cur?.type || "TV") === "MOVIE" ? "MOVIE" : "TV";
  const priceIn = Number(pick("price", cur?.price));
  const airDay = pick("airDay", cur?.air_day) || null;
  if (airDay && !DAYS.includes(airDay)) return { error: "Hari tayang tidak valid" };
  const airDate = pick("airDate", cur?.air_date) || null;
  if (airDate && !/^\d{4}-\d{2}-\d{2}$/.test(airDate)) return { error: "Tanggal tayang tidak valid" };
  const yr = pick("releaseYear", cur?.release_year);
  return {
    data: {
      title, synopsis,
      alternative: (String(pick("alternative", cur?.alternative) ?? "").trim()) || null,
      posterUrl: posterUrl || null, bannerUrl: bannerUrl || null,
      releaseYear: yr ? Number(yr) : null,
      rating: rt ? (+rt).toFixed(1) : null,
      status, type,
      price: type === "MOVIE" ? (priceIn > 0 ? Math.round(priceIn) : DEFAULT_PRICE) : null,
      airDay, airDate,
      featured: !!pick("featured", cur?.featured)
    }
  };
}

export async function resolveGenreIds(client, body) {
  const ids = new Set(Array.isArray(body.genreIds) ? body.genreIds : []);
  for (const name of Array.isArray(body.genreNames) ? body.genreNames : []) {
    const nm = String(name).trim(); if (!nm) continue;
    const f = await client.query("SELECT id FROM genres WHERE lower(name) = lower($1)", [nm]);
    if (f.rows[0]) { ids.add(f.rows[0].id); continue; }
    const id = uid("g"), slug = slugify(nm) || id;
    const ins = await client.query("INSERT INTO genres (id, name, slug) VALUES ($1,$2,$3) ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id", [id, nm, slug]);
    ids.add(ins.rows[0].id);
  }
  return [...ids];
}

export async function uniqueSlug(client, title, fallback) {
  const base = slugify(title) || fallback || "anime";
  let slug = base, i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const r = await client.query("SELECT 1 FROM anime WHERE slug = $1", [slug]);
    if (!r.rows.length) return slug;
    slug = base + "-" + i++;
  }
}
