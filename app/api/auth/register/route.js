import { query } from "@/lib/db";
import { hashPassword, strongPassword, startSession, json, fail } from "@/lib/auth";
import { uid } from "@/lib/util";

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim(), email = String(b.email || "").trim().toLowerCase(), pw = String(b.password || "");
  if (name.length < 2) return fail("Nama minimal 2 karakter");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Email tidak valid");
  if (!strongPassword(pw)) return fail("Password minimal 8 karakter dengan huruf besar, huruf kecil, dan angka");
  const dup = await query("SELECT 1 FROM users WHERE email = $1", [email]);
  if (dup.rows.length) return fail("Email sudah terdaftar", 409);
  const id = uid("u");
  await query("INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES ($1,$2,$3,$4,'USER',$5)", [id, name, email, hashPassword(pw), Date.now()]);
  await startSession(id);
  return json({ user: { id, name, email, role: "USER" } });
}
