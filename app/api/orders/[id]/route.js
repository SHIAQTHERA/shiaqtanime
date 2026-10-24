import { query } from "@/lib/db";
import { requireAdmin, json, fail } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const { id } = await params;
  if (!(await requireAdmin())) return fail("Hanya admin", 403);
  const b = await req.json().catch(() => ({}));
  if (!["PAID", "REJECTED", "PENDING"].includes(b.status)) return fail("Status tidak valid");
  const r = await query("UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3", [b.status, Date.now(), id]);
  if (!r.rowCount) return fail("Pesanan tidak ditemukan", 404);
  return json({ ok: true });
}
