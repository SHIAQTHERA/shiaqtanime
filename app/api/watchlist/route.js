import { query } from "@/lib/db";
import { getSessionUser, json, fail } from "@/lib/auth";

/** Toggle daftar saya. Mengembalikan { saved } */
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return fail("Masuk terlebih dahulu", 401);
  const b = await req.json().catch(() => ({}));
  const animeId = String(b.animeId || "");
  const a = await query("SELECT 1 FROM anime WHERE id = $1", [animeId]);
  if (!a.rows.length) return fail("Anime tidak ditemukan", 404);
  const del = await query("DELETE FROM watchlist WHERE user_id = $1 AND anime_id = $2", [user.id, animeId]);
  if (del.rowCount) return json({ saved: false });
  await query("INSERT INTO watchlist (user_id, anime_id, created_at) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [user.id, animeId, Date.now()]);
  return json({ saved: true });
}
