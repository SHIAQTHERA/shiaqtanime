import { tx } from "@/lib/db";
import { requireAdmin, json, fail } from "@/lib/auth";
import { normalizeAnime, resolveGenreIds, uniqueSlug } from "@/lib/animeInput";
import { uid } from "@/lib/util";

export async function POST(req) {
  if (!(await requireAdmin())) return fail("Hanya admin", 403);
  const body = await req.json().catch(() => ({}));
  const v = normalizeAnime(body, null);
  if (v.error) return fail(v.error);
  const d = v.data, now = Date.now(), id = uid("a");
  const anilistId = Number.isInteger(body.anilistId) ? body.anilistId : null;
  try {
    await tx(async (c) => {
      const slug = await uniqueSlug(c, d.title, anilistId ? "anime-" + anilistId : "anime");
      await c.query(
        `INSERT INTO anime (id, slug, anilist_id, title, alternative, synopsis, poster_url, banner_url, release_year, status, air_day, air_date, type, price, rating, featured, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17)`,
        [id, slug, anilistId, d.title, d.alternative, d.synopsis, d.posterUrl, d.bannerUrl, d.releaseYear, d.status, d.airDay, d.airDate, d.type, d.price, d.rating, d.featured, now]);
      for (const gid of await resolveGenreIds(c, body)) await c.query("INSERT INTO anime_genres (anime_id, genre_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [id, gid]);
      if (d.type === "MOVIE") await c.query("INSERT INTO episodes (id, anime_id, number, title, sources, created_at) VALUES ($1,$2,1,'Movie','[]'::jsonb,$3)", [uid("e"), id, now]);
    });
  } catch (e) {
    return fail("Gagal menyimpan anime", 500);
  }
  return json({ id }, 201);
}
