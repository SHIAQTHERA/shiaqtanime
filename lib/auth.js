import crypto from "node:crypto";
import { cookies } from "next/headers";
import { query } from "./db.js";

const COOKIE = "shq_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET belum diatur (minimal 16 karakter).");
  return s;
}
const sign = (v) => crypto.createHmac("sha256", secret()).update(v).digest("base64url");

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}
export function verifyPassword(pw, stored) {
  const [alg, salt, hash] = String(stored).split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const a = Buffer.from(hash, "hex"), b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export const strongPassword = (pw) => pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw);

export async function startSession(userId) {
  const payload = `${userId}.${Date.now()}`;
  const token = `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}
export async function endSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSessionUser() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const [b64, sig] = raw.split(".");
  if (!b64 || !sig) return null;
  let payload;
  try { payload = Buffer.from(b64, "base64url").toString(); } catch (e) { return null; }
  const good = sign(payload);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  const userId = payload.split(".")[0];
  const { rows } = await query("SELECT id, name, email, role FROM users WHERE id = $1", [userId]);
  return rows[0] || null;
}

export async function requireAdmin() {
  const u = await getSessionUser();
  return u && u.role === "ADMIN" ? u : null;
}

export const json = (data, status = 200) => Response.json(data, { status });
export const fail = (message, status = 400) => Response.json({ error: message }, { status });
