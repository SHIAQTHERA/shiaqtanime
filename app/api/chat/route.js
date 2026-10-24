import { query } from "@/lib/db";
import { getSessionUser, requireAdmin, json, fail } from "@/lib/auth";
import { uid } from "@/lib/util";

export const dynamic = "force-dynamic";
const last = new Map(); // rate limit sederhana per pengirim

const map = (r) => ({ id: r.id, name: r.name, role: r.role, uid: r.sender_id, text: r.text, t: Number(r.created_at) });

export async function GET() {
  const { rows } = await query("SELECT * FROM (SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 200) x ORDER BY created_at ASC");
  return json({ messages: rows.map(map) });
}

export async function POST(req) {
  const user = await getSessionUser();
  const b = await req.json().catch(() => ({}));
  const text = String(b.text || "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (!text) return fail("Pesan kosong");
  let name, role, sender;
  if (user) { name = user.name; role = user.role; sender = user.id; }
  else {
    name = String(b.nick || "").replace(/\s+/g, " ").trim().slice(0, 20);
    if (name.length < 2) return fail("Isi nama panggilan (min. 2 huruf)");
    role = "GUEST"; sender = String(b.senderId || "").replace(/[^\w-]/g, "").slice(0, 40) || "guest";
  }
  const now = Date.now();
  if (now - (last.get(sender) || 0) < 1500) return fail("Terlalu cepat", 429);
  last.set(sender, now);
  if (last.size > 5000) last.clear();
  await query("INSERT INTO chat_messages (id, name, role, sender_id, text, created_at) VALUES ($1,$2,$3,$4,$5,$6)", [uid("m"), name, role, sender, text, now]);
  await query("DELETE FROM chat_messages WHERE id NOT IN (SELECT id FROM chat_messages ORDER BY created_at DESC LIMIT 200)");
  return json({ ok: true }, 201);
}

export async function DELETE() {
  if (!(await requireAdmin())) return fail("Hanya admin", 403);
  await query("DELETE FROM chat_messages");
  return json({ ok: true });
}
