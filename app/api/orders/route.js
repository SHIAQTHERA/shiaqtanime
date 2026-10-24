import { query } from "@/lib/db";
import { getSessionUser, json, fail } from "@/lib/auth";
import { uid, orderRef, DEFAULT_PRICE } from "@/lib/util";

/** Pembeli menekan "Saya Sudah Bayar" -> pesanan PENDING (menunggu konfirmasi admin) */
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return fail("Masuk terlebih dahulu", 401);
  const b = await req.json().catch(() => ({}));
  const a = (await query("SELECT id, type, price FROM anime WHERE id = $1", [String(b.animeId || "")])).rows[0];
  if (!a || a.type !== "MOVIE") return fail("Movie tidak ditemukan", 404);
  const paid = await query("SELECT 1 FROM orders WHERE user_id = $1 AND anime_id = $2 AND status = 'PAID' LIMIT 1", [user.id, a.id]);
  if (paid.rows.length) return fail("Movie ini sudah Anda beli", 409);
  const pend = await query("SELECT id FROM orders WHERE user_id = $1 AND anime_id = $2 AND status = 'PENDING' LIMIT 1", [user.id, a.id]);
  if (pend.rows.length) return json({ id: pend.rows[0].id });
  const id = uid("o");
  await query("INSERT INTO orders (id, user_id, anime_id, amount, status, ref, created_at) VALUES ($1,$2,$3,$4,'PENDING',$5,$6)",
    [id, user.id, a.id, a.price > 0 ? a.price : DEFAULT_PRICE, orderRef(user.id, a.id), Date.now()]);
  return json({ id }, 201);
}
