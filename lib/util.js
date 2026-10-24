import crypto from "node:crypto";

let counter = 0;
export const uid = (p) =>
  p + Date.now().toString(36) + (counter++).toString(36) + crypto.randomBytes(4).toString("hex");

export const slugify = (s) =>
  String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const httpsOk = (u) => { try { return new URL(u).protocol === "https:"; } catch (e) { return false; } };

const hk = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
export const orderRef = (userId, animeId) => "SHQ-" + hk(userId + animeId).slice(0, 5).toUpperCase();

export const DEFAULT_PRICE = 5000;

export function parseSources(list) {
  const out = [];
  for (const s of Array.isArray(list) ? list : []) {
    const url = String((s && s.url) || "").trim();
    if (!httpsOk(url)) return { error: `URL harus diawali https:// → "${url.slice(0, 60)}"` };
    out.push({ label: String((s && s.label) || "Server " + (out.length + 1)).trim().slice(0, 30), url });
  }
  return { list: out };
}
