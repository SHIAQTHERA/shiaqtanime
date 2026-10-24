import { tx, query } from "@/lib/db";
import { requireAdmin, json, fail } from "@/lib/auth";
import { normalizeAnime, resolveGenreIds } from "@/lib/animeInput";
import { uid } from "@/lib/util";

export async function PATCH(req, { params }) {
  const { id } = await params;
  if (!(await requireAdmin())) return fail("Hanya admin", 403);
  const body = await req.json().catch(() => ({}));
  const cur = (await query("SELECT * FROM anime WHERE id = $1", [id])).rows[0];
  if (!cur) return fail("Anime tidak ditemukan", 404);
  const v = normalizeAnime(body, cur);
  if (v.error) return fail(v.error);
  const d = v.data, now = Date.now();
  await tx(async (c) => {
    await c.query(
      `UPDATE anime SET title=$1, alternative=$2, synopsis=$3, poster_url=$4, banner_url=$5, release_year=$6, status=$7,
         air_day=$8, air_date=$9, type=$10, price=$11, rating=$12, featured=$13, updated_at=$14 WHERE id=$15`,
      [d.title, d.alternative, d.synopsis, d.posterUrl, d.bannerUrl, d.releaseYear, d.status, d.airDay, d.airDate, d.type, d.price, d.rating, d.featured, now, id]);
    if (Array.isArray(body.genreIds) || Array.isArray(body.genreNames)) {
      await c.query("DELETE FROM anime_genres WHERE anime_id = $1", [id]);
      for (const gid of await resolveGenreIds(c, body)) await c.query("INSERT INTO anime_genres (anime_id, genre_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [id, gid]);
    }
    if (d.type === "MOVIE") {
      const e = await c.query("SELECT 1 FROM episodes WHERE anime_id = $1 LIMIT 1", [id]);
      if (!e.rows.length) await c.query("INSERT INTO episodes (id, anime_id, number, title, sources, created_at) VALUES ($1,$2,1,'Movie','[]'::jsonb,$3)", [uid("e"), id, now]);
    }
  });
  return json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  if (!(await requireAdmin())) return fail("Hanya admin", 403);
  await query("DELETE FROM anime WHERE id = $1", [id]);
  return json({ ok: true });
}
