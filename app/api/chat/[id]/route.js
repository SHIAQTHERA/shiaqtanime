import { query } from "@/lib/db";
import { requireAdmin, json, fail } from "@/lib/auth";

export async function DELETE(_req, { params }) {
  const { id } = await params;
  if (!(await requireAdmin())) return fail("Hanya admin", 403);
  await query("DELETE FROM chat_messages WHERE id = $1", [id]);
  return json({ ok: true });
}
