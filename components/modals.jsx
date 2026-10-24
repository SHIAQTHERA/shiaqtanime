"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, useStore } from "./store";
import { optimizedImageUrl, DAYS, DEFAULT_PRICE, httpsOk, isMovie, moviePrice, orderRef, parseSourcesText, rupiah, srcToText } from "@/lib/client";
import { aniById, aniClean, aniStart, aniTitle, aniToPayload, FMT, timeOf, translateSynopsisToId, wdayOf } from "@/lib/anilist";

function Shell({ onClose, width, children }) {
  const down = useRef(false);
  return (
    <div className="modal" onMouseDown={(e) => { down.current = e.target === e.currentTarget; }} onClick={(e) => { if (down.current && e.target === e.currentTarget) onClose(); }}>
      <div className="panel" style={width ? { width: `min(${width}px,100%)` } : undefined}>{children}</div>
    </div>
  );
}

/* ===== Tambah / Edit anime ===== */
function AnimeModal({ id, preset }) {
  const S = useStore();
  const a = id ? S.data.anime.find((x) => x.id === id) : null;
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const genres = [...S.data.genres].sort((x, y) => x.name.localeCompare(y.name));
  const v = (k) => (a && a[k] != null ? a[k] : "");
  const curType = a ? a.type : preset === "MOVIE" ? "MOVIE" : "TV";
  const curStatus = a ? a.status : preset === "MOVIE" ? "COMPLETED" : preset || "ONGOING";

  const submit = async (e) => {
    e.preventDefault(); const f = e.target; setErr("");
    const fail = (s) => setErr(s);
    const title = f.title.value.trim(), synopsis = f.synopsis.value.trim(), poster = f.posterUrl.value.trim(), banner = f.bannerUrl.value.trim();
    if (!title || !synopsis) return fail("Judul dan sinopsis wajib diisi");
    if ((poster && !httpsOk(poster)) || (banner && !httpsOk(banner))) return fail("URL poster/banner harus HTTPS");
    const rt = f.rating.value.trim(); if (rt && (isNaN(rt) || +rt < 0 || +rt > 10)) return fail("Rating harus 0–10");
    const payload = {
      title, alternative: f.alternative.value.trim() || null, synopsis, posterUrl: poster || null, bannerUrl: banner || null,
      releaseYear: f.releaseYear.value ? Number(f.releaseYear.value) : null, rating: rt ? (+rt).toFixed(1) : null,
      status: f.status.value, type: f.type.value, price: f.type.value === "MOVIE" ? (Number(f.price.value) > 0 ? Number(f.price.value) : DEFAULT_PRICE) : null,
      airDate: f.airDate.value || null, airDay: f.airDay.value || null, featured: f.featured.checked,
      genreIds: [...f.querySelectorAll("[name=genre]:checked")].map((x) => x.value)
    };
    setBusy(true);
    try {
      if (a) await api("PATCH", "/api/anime/" + a.id, payload); else await api("POST", "/api/anime", payload);
      await S.refresh(); S.closeModal();
    } catch (ex) { setErr(ex.message); setBusy(false); }
  };

  return (
    <Shell onClose={S.closeModal}>
      <div className="sectionhead" style={{ marginBottom: 6 }}><h2 style={{ margin: 0 }}>{a ? "Edit Anime" : "Tambah Anime"}</h2><button className="btn" type="button" onClick={S.closeModal}>✕</button></div>
      <form className="form" onSubmit={submit}>
        <div className="field"><label>Judul anime</label><input name="title" required defaultValue={v("title")} /></div>
        <div className="field"><label>Judul alternatif (opsional)</label><input name="alternative" defaultValue={v("alternative")} /></div>
        <div className="field"><label>Sinopsis</label><textarea name="synopsis" required defaultValue={v("synopsis")} /></div>
        <div className="field"><label>URL poster (opsional, HTTPS)</label><input type="url" name="posterUrl" placeholder="https://..." defaultValue={v("posterUrl")} /></div>
        <div className="field"><label>URL banner slider (opsional, HTTPS)</label><input type="url" name="bannerUrl" placeholder="https://..." defaultValue={v("bannerUrl")} /></div>
        <div className="row2">
          <div className="field"><label>Tahun rilis</label><input type="number" name="releaseYear" min="1900" max="2100" defaultValue={v("releaseYear")} /></div>
          <div className="field"><label>Rating (0–10)</label><input type="number" name="rating" min="0" max="10" step="0.1" defaultValue={v("rating")} /></div>
        </div>
        <div className="row2">
          <div className="field"><label>Jenis</label><select name="type" defaultValue={curType}><option value="TV">Serial TV / Anime</option><option value="MOVIE">Movie Anime Layar Lebar (berbayar)</option></select></div>
          <div className="field"><label>Harga tonton movie (Rp)</label><input type="number" name="price" min="1000" step="500" defaultValue={a && a.price ? a.price : 5000} /></div>
        </div>
        <div className="field"><label>Status</label><select name="status" defaultValue={curStatus}>{["ONGOING", "COMPLETED", "UPCOMING"].map((s) => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}</select></div>
        <div className="field"><label>Hari tayang mingguan (untuk anime Ongoing, tampil di Jadwal Rilis)</label><select name="airDay" defaultValue={a && a.airDay ? a.airDay : ""}><option value="">— Tidak dijadwalkan —</option>{DAYS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
        <div className="field"><label>Tanggal tayang (untuk jadwal "Segera Tayang", pilih status Upcoming)</label><input type="date" name="airDate" defaultValue={v("airDate")} /></div>
        <div className="field"><label>Genre</label><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>{genres.map((g) => <label key={g.id} style={{ display: "flex", gap: 5, alignItems: "center" }}><input type="checkbox" name="genre" value={g.id} defaultChecked={!!(a && a.genreIds.includes(g.id))} />{g.name}</label>)}</div></div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}><input type="checkbox" name="featured" defaultChecked={!!(a && a.featured)} /> Tampilkan di Anime Pilihan & prioritas slider populer</label>
        {err && <p className="notice-error">{err}</p>}
        <button className="btn primary" disabled={busy}>{a ? "Simpan Perubahan" : "Simpan Anime"}</button>
      </form>
    </Shell>
  );
}

/* ===== Sumber video episode ===== */
function SourceModal({ epId }) {
  const S = useStore();
  const e = S.data.episodes.find((x) => x.id === epId);
  const [err, setErr] = useState("");
  if (!e) return null;
  const submit = async (ev) => {
    ev.preventDefault();
    const ps = parseSourcesText(ev.target.sources.value);
    if (ps.error) { setErr(ps.error); return; }
    try { await api("PATCH", "/api/episodes/" + e.id, { sources: ps.list }); await S.refresh(); S.closeModal(); } catch (ex) { setErr(ex.message); }
  };
  return (
    <Shell onClose={S.closeModal}>
      <div className="sectionhead" style={{ marginBottom: 6 }}><h2 style={{ margin: 0 }}>Sumber Video — Episode {e.number}</h2><button className="btn" type="button" onClick={S.closeModal}>✕</button></div>
      <form className="form" onSubmit={submit}>
        <div className="field"><label>Satu sumber per baris: Nama server | URL</label><textarea name="sources" style={{ minHeight: 150 }} placeholder="Server 1 | https://contoh.com/episode1.mp4" defaultValue={srcToText(e)} /></div>
        <small className="muted" style={{ lineHeight: 1.6 }}>Didukung: file langsung (.mp4/.webm), HLS (.m3u8), YouTube, Google Drive, dan link embed. Semua harus https://. Kosongkan untuk menghapus semua sumber.</small>
        {err && <p className="notice-error">{err}</p>}
        <button className="btn primary">Simpan Sumber</button>
      </form>
    </Shell>
  );
}

/* ===== Beli movie ===== */
export function openBuy(S, animeId) {
  if (!S.user) { S.toast("Masuk dulu untuk membeli movie."); S.router.push("/login"); return; }
  S.openModal({ kind: "buy", id: animeId });
}
function BuyModal({ animeId }) {
  const S = useStore();
  const a = S.data.anime.find((x) => x.id === animeId), u = S.user;
  const [busy, setBusy] = useState(false);
  if (!a || !u) return null;
  const pay = S.data.settings.payment || {}, o = S.orderOf(u, a), price = moviePrice(a), ref = orderRef(u, a), ep = S.data.episodes.find((e) => e.animeId === a.id);
  const hasPay = pay.method || pay.instructions || pay.qrisUrl;
  const wa = pay.whatsapp ? `https://wa.me/${pay.whatsapp}?text=${encodeURIComponent(`Halo admin, saya sudah bayar movie "${a.title}" (${rupiah(price)}). Ref: ${ref}. Email: ${u.email}`)}` : "";
  const paid = async () => {
    setBusy(true);
    try { await api("POST", "/api/orders", { animeId: a.id }); await S.refresh(); } catch (e) { S.toast(e.message); }
    setBusy(false);
  };
  let body;
  if (S.hasAccess(a)) body = (<><p className="muted" style={{ fontSize: 13 }}>Movie ini sudah bisa Anda tonton.</p><div className="actions">{ep && <Link className="btn primary" href={`/watch/${ep.id}`} onClick={S.closeModal}>▶ Tonton Sekarang</Link>}</div></>);
  else if (o && o.status === "PENDING") body = (<><div className="notice">⏳ Pembayaran Anda sedang <b>menunggu konfirmasi admin</b>. Kode ref: <b>{ref}</b>. Setelah dikonfirmasi, tombol Tonton akan aktif di halaman movie.</div>{wa && <div className="actions"><a className="btn" href={wa} target="_blank" rel="noopener noreferrer">Kirim bukti ke WhatsApp admin</a></div>}</>);
  else body = (
    <>
      {o && o.status === "REJECTED" && <div className="notice notice-error" style={{ marginBottom: 12 }}>Pembayaran sebelumnya ditolak admin. Silakan bayar ulang dan konfirmasi lagi.</div>}
      <ol className="pay-steps"><li>Bayar <b>{rupiah(price)}</b> {hasPay ? "dengan cara di bawah ini" : ""}.</li><li>Cantumkan kode ref <b style={{ color: "var(--gold)" }}>{ref}</b> di catatan transfer.</li><li>Tekan <b>Saya Sudah Bayar</b>, lalu tunggu admin mengonfirmasi.</li></ol>
      {hasPay ? (
        <div className="panel" style={{ background: "#0b0e18", marginBottom: 14 }}>
          {pay.method && <div style={{ fontWeight: 700, marginBottom: 6 }}>{pay.method}</div>}
          {pay.qrisUrl && <img src={pay.qrisUrl} alt="QRIS" referrerPolicy="no-referrer" style={{ maxWidth: 230, width: "100%", borderRadius: 12, background: "#fff", padding: 8, display: "block", margin: "6px 0" }} />}
          {pay.instructions && <div className="muted" style={{ fontSize: 12, lineHeight: 1.8, whiteSpace: "pre-line" }}>{pay.instructions}</div>}
        </div>
      ) : <div className="notice notice-error" style={{ marginBottom: 12 }}>Admin belum mengatur metode pembayaran. Hubungi admin.</div>}
      <div className="actions"><button className="btn primary" onClick={paid} disabled={!hasPay || busy}>✓ Saya Sudah Bayar</button>{wa && <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">Hubungi admin via WhatsApp</a>}</div>
    </>
  );
  return (
    <Shell onClose={S.closeModal}>
      <div className="sectionhead" style={{ marginBottom: 6 }}><div><div className="eyebrow">TONTON MOVIE</div><h2 style={{ margin: "6px 0 0" }}>{a.title}</h2></div><button className="btn" type="button" onClick={S.closeModal}>✕</button></div>
      <div style={{ font: "700 34px 'Space Grotesk'", color: "var(--gold)", margin: "8px 0 2px" }}>{rupiah(price)}</div>
      <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>Sekali bayar per movie · bisa ditonton berulang kali</p>
      {body}
    </Shell>
  );
}

/* ===== Detail anime dari AniList ===== */
export async function removeAniFromCatalog(S, id, silent) {
  const a = S.data.anime.find((x) => x.id === id); if (!a) return;
  const paid = S.data.orders.some((o) => o.animeId === id && o.status === "PAID");
  if (!silent && !confirm(`Batalkan "${a.title}" dari katalog? Anime dan episodenya akan dihapus.` + (paid ? "\n\nPERHATIAN: movie ini sudah punya pembelian lunas." : ""))) return;
  try { await api("DELETE", "/api/anime/" + id); } catch (e) { S.toast(e.message); return; }
  S.closeModal(); S.toast("Dibatalkan — dihapus dari katalog"); await S.refresh();
}
function AniModal({ id }) {
  const S = useStore();
  const m = aniById.get(id);
  const raw = m ? aniClean(m.description) || "Sinopsis belum tersedia." : "";
  const [syn, setSyn] = useState(raw);
  useEffect(() => {
    let alive = true;
    if (raw !== "Sinopsis belum tersedia.") translateSynopsisToId(raw).then((t) => { if (alive) setSyn(t); });
    return () => { alive = false; };
  }, [raw]);
  if (!m) return null;
  const img = m.coverImage && (m.coverImage.extraLarge || m.coverImage.large), studio = m.studios && m.studios.nodes && m.studios.nodes[0] && m.studios.nodes[0].name;
  const existing = S.data.anime.find((a) => a.anilistId === m.id), have = !!existing;
  const nx = m.nextAiringEpisode ? `Eps. ${m.nextAiringEpisode.episode} tayang ${wdayOf(m.nextAiringEpisode.airingAt)}, ${timeOf(m.nextAiringEpisode.airingAt)} WIB` : null;

  const add = async () => {
    try {
      const { id: newId } = await api("POST", "/api/anime", aniToPayload(m));
      const title = aniTitle(m);
      S.closeModal();
      S.toast("Ditambahkan ke katalog: " + title, () => removeAniFromCatalog(S, newId, true));
      await S.refresh();
      translateSynopsisToId(aniClean(m.description) || "Sinopsis belum tersedia.").then(async (text) => {
        if (text && text !== (aniClean(m.description) || "")) { try { await api("PATCH", "/api/anime/" + newId, { synopsis: text }); await S.refresh(); } catch (e) {} }
      });
    } catch (e) { S.toast(e.message); }
  };

  return (
    <Shell onClose={S.closeModal} width={680}>
      <div className="sectionhead" style={{ marginBottom: 10 }}>
        <div><div className="eyebrow">DATA ANILIST</div><h2 style={{ margin: "6px 0 0" }}>{aniTitle(m)}</h2>{m.title.native && <p>{m.title.native}</p>}</div>
        <button className="btn" type="button" onClick={S.closeModal}>✕</button>
      </div>
      <div className="ani-detail">
        {img ? <img src={optimizedImageUrl(img, 384, 72)} alt={aniTitle(m)} width="384" height="512" loading="lazy" decoding="async" referrerPolicy="no-referrer" /> : <div />}
        <div>
          <div style={{ marginBottom: 10 }}>{(m.genres || []).map((g) => <span key={g} className="tag">{g}</span>)}</div>
          <div className="meta" style={{ justifyContent: "flex-start", gap: 14, flexWrap: "wrap", fontSize: 12, marginBottom: 10 }}>
            <span>{FMT[m.format] || "Anime"}</span><span>Mulai: {aniStart(m)}</span>{m.episodes ? <span>{m.episodes} episode</span> : null}{studio ? <span>{studio}</span> : null}<span className="rating">★ {m.averageScore ? (m.averageScore / 10).toFixed(1) : "—"}</span>
          </div>
          {nx && <div className="notice" style={{ margin: "0 0 10px" }}>{nx}</div>}
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.8, margin: 0, maxHeight: 200, overflow: "auto", whiteSpace: "pre-line" }}>{syn}</p>
        </div>
      </div>
      <div className="actions">
        <a className="btn" href={`https://anilist.co/anime/${m.id}`} target="_blank" rel="noopener noreferrer">Lihat di AniList ↗</a>
        {S.isAdmin && (have
          ? <><button className="btn" disabled>✓ Sudah ada di katalog</button><button className="btn" onClick={() => removeAniFromCatalog(S, existing.id)} style={{ color: "#ffb3b3", borderColor: "#ffb3b366" }}>↩ Batalkan dari Katalog</button></>
          : <button className="btn primary" onClick={add}>＋ Tambah ke Katalog</button>)}
      </div>
    </Shell>
  );
}

export function Modals() {
  const S = useStore();
  const m = S.modal;
  useEffect(() => { const h = (e) => { if (e.key === "Escape") S.closeModal(); }; document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, [S.closeModal]); // eslint-disable-line
  if (!m || !S.ready) return null;
  if (m.kind === "anime") return <AnimeModal key={m.id || "new"} id={m.id} preset={m.preset} />;
  if (m.kind === "source") return <SourceModal epId={m.id} />;
  if (m.kind === "buy") return <BuyModal animeId={m.id} />;
  if (m.kind === "ani") return <AniModal id={m.id} />;
  return null;
}
