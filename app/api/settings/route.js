import { query } from "@/lib/db";
import { requireAdmin, json, fail } from "@/lib/auth";
import { httpsOk } from "@/lib/util";

const put = (key, value) =>
  query("INSERT INTO settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [key, JSON.stringify(value)]);

export async function PUT(req) {
  if (!(await requireAdmin())) return fail("Hanya admin", 403);
  const b = await req.json().catch(() => ({}));

  if (b.payment) {
    const q = String(b.payment.qrisUrl || "").trim();
    if (q && !httpsOk(q)) return fail("URL QRIS harus HTTPS");
    await put("payment", {
      method: String(b.payment.method || "").trim(),
      qrisUrl: q,
      instructions: String(b.payment.instructions || "").trim(),
      whatsapp: String(b.payment.whatsapp || "").replace(/\D/g, "")
    });
  }
  if (typeof b.saweria === "string") {
    const v = b.saweria.trim();
    if (v) {
      let u; try { u = new URL(v); } catch (e) {}
      if (!u || u.protocol !== "https:" || !(u.hostname === "saweria.co" || u.hostname.endsWith(".saweria.co"))) return fail("Link harus berupa alamat Saweria, contoh: https://saweria.co/namakamu");
    }
    await put("saweria", v);
  }
  if (b.socialLinks) {
    const links = {};
    for (const key of ["tiktok", "facebook", "instagram"]) { const v = String(b.socialLinks[key] || "").trim(); if (v && !httpsOk(v)) return fail("Semua tautan media sosial harus diawali https://"); links[key] = v; }
    await put("socialLinks", links);
  }
  if (b.maintenance && typeof b.maintenance.enabled === "boolean") {
    await put("maintenance", { enabled: b.maintenance.enabled, message: String(b.maintenance.message || "Kami sedang melakukan pemeliharaan untuk meningkatkan pengalaman menonton.").trim().slice(0, 240) });
  }
  if (b.extLink) {
    const url = String(b.extLink.url || "").trim(), label = String(b.extLink.label || "").trim().slice(0, 20);
    if (url && !httpsOk(url)) return fail("URL harus diawali https://");
    await put("extLink", { label, url });
  }
  return json({ ok: true });
}
