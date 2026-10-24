import { query } from "@/lib/db";
import { requireAdmin, hashPassword, strongPassword, json, fail } from "@/lib/auth";

export async function PATCH(req) {
  const admin = await requireAdmin();
  if (!admin) return fail("Hanya admin", 403);
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim(), email = String(b.email || "").trim().toLowerCase(), pw = String(b.password || "");
  if (name.length < 2) return fail("Nama minimal 2 karakter");
  const dup = await query("SELECT 1 FROM users WHERE email = $1 AND id <> $2", [email, admin.id]);
  if (dup.rows.length) return fail("Email sudah dipakai akun lain", 409);
  if (pw && !strongPassword(pw)) return fail("Password minimal 8 karakter dengan huruf besar, huruf kecil, dan angka");
  if (pw) await query("UPDATE users SET name=$1, email=$2, password_hash=$3 WHERE id=$4", [name, email, hashPassword(pw), admin.id]);
  else await query("UPDATE users SET name=$1, email=$2 WHERE id=$3", [name, email, admin.id]);
  return json({ user: { id: admin.id, name, email, role: "ADMIN" } });
}
