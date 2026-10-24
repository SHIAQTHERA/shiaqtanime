import { query } from "@/lib/db";
import { requireAdmin, json, fail } from "@/lib/auth";
import { parseSources } from "@/lib/util";

export async function PATCH(req, { params }) {
  const { id } = await params;
  if (!(await requireAdmin())) return fail("Hanya admin", 403);
  const b = await req.json().catch(() => ({}));
  const ps = parseSources(b.sources);
  if (ps.error) return fail(ps.error);
  const r = await query("UPDATE episodes SET sources = $1::jsonb WHERE id = $2", [JSON.stringify(ps.list), id]);
  if (!r.rowCount) return fail("Episode tidak ditemukan", 404);
  return json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  if (!(await requireAdmin())) return fail("Hanya admin", 403);
  await query("DELETE FROM episodes WHERE id = $1", [id]);
  return json({ ok: true });
}
