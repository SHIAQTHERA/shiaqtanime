import { query } from "@/lib/db";
import { requireAdmin, json, fail } from "@/lib/auth";
import { parseSources, uid } from "@/lib/util";

export async function POST(req, { params }) {
  const { id } = await params;
  if (!(await requireAdmin())) return fail("Hanya admin", 403);
  const b = await req.json().catch(() => ({}));
  const number = Number(b.number);
  if (!Number.isInteger(number) || number < 1) return fail("Nomor episode tidak valid");
  const ps = parseSources(b.sources);
  if (ps.error) return fail(ps.error);
  const a = await query("SELECT 1 FROM anime WHERE id = $1", [id]);
  if (!a.rows.length) return fail("Anime tidak ditemukan", 404);
  const dup = await query("SELECT 1 FROM episodes WHERE anime_id = $1 AND number = $2", [id, number]);
  if (dup.rows.length) return fail("Nomor episode sudah ada", 409);
  const now = Date.now(), eid = uid("e");
  await query("INSERT INTO episodes (id, anime_id, number, title, synopsis, sources, created_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)",
    [eid, id, number, String(b.title || "").trim() || null, String(b.synopsis || "").trim() || null, JSON.stringify(ps.list), now]);
  await query("UPDATE anime SET updated_at = $1 WHERE id = $2", [now, id]);
  return json({ id: eid }, 201);
}
