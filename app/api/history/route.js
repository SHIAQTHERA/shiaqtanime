import { query } from "@/lib/db";
import { getSessionUser, json, fail } from "@/lib/auth";
import { uid } from "@/lib/util";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return json({ ok: true });
  const b = await req.json().catch(() => ({}));
  const ep = (await query("SELECT e.id, e.anime_id, a.type FROM episodes e JOIN anime a ON a.id = e.anime_id WHERE e.id = $1", [String(b.episodeId || "")])).rows[0];
  if (!ep) return fail("Episode tidak ditemukan", 404);
  if (ep.type === "MOVIE" && user.role !== "ADMIN") {
    const paid = await query("SELECT 1 FROM orders WHERE user_id = $1 AND anime_id = $2 AND status = 'PAID' LIMIT 1", [user.id, ep.anime_id]);
    if (!paid.rows.length) return fail("Movie belum dibeli", 403);
  }
  await query(
    `INSERT INTO history (id, user_id, anime_id, episode_id, progress_sec, completed, updated_at)
     VALUES ($1,$2,$3,$4,0,FALSE,$5)
     ON CONFLICT (user_id, episode_id) DO UPDATE SET updated_at = EXCLUDED.updated_at`,
    [uid("h"), user.id, ep.anime_id, ep.id, Date.now()]);
  return json({ ok: true });
}
