import { query } from "@/lib/db";
import { verifyPassword, startSession, json, fail } from "@/lib/auth";

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase(), password = String(b.password || "");
  const { rows } = await query("SELECT id, name, email, role, password_hash FROM users WHERE email = $1", [email]);
  const u = rows[0];
  if (!u || !verifyPassword(password, u.password_hash)) return fail("Email atau password salah", 401);
  await startSession(u.id);
  return json({ user: { id: u.id, name: u.name, email: u.email, role: u.role } });
}
