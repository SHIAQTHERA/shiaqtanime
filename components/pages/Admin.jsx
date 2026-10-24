"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, useStore } from "../store";
import { NotFound } from "../ui";
import { STL, epSources, httpsOk, parseSourcesText, rupiah } from "@/lib/client";

function useGate() {
  const S = useStore();
  const redirect = !S.user ? "/login" : S.user.role !== "ADMIN" ? "denied" : null;
  useEffect(() => { if (!S.user) S.router.replace("/login"); }, [S.user]); // eslint-disable-line
  return redirect;
}

/* Form kecil dengan pesan error/sukses */
function useForm(action) {
  const [err, setErr] = useState(""), [ok, setOk] = useState(""), [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setOk(""); setBusy(true);
    try { const m = await action(e.target); if (m) setOk(m); } catch (ex) { setErr(ex.message); }
    setBusy(false);
  };
  return { err, ok, busy, submit };
}

function OrdersPanel() {
  const S = useStore(); const pay = S.data.settings.payment || {};
  const rows = [...S.data.orders].sort((a, b) => b.createdAt - a.createdAt);
  const setStatus = async (id, st) => { try { await api("PATCH", "/api/orders/" + id, { status: st }); await S.refresh(); } catch (e) { S.toast(e.message); } };
  const tg = (color) => ({ background: "none", cursor: "pointer", color, borderColor: color + "66" });

  const payForm = useForm(async (f) => {
    const q = f.qrisUrl.value.trim(); if (q && !httpsOk(q)) throw new Error("URL QRIS harus HTTPS");
    await api("PUT", "/api/settings", { payment: { method: f.method.value.trim(), qrisUrl: q, instructions: f.instructions.value.trim(), whatsapp: f.whatsapp.value.replace(/\D/g, "") } });
    await S.refresh(); return "Pengaturan pembayaran disimpan.";
  });
  const siteForm = useForm(async (f) => {
    const v = f.saweria.value.trim();
    await api("PUT", "/api/settings", { saweria: v }); await S.refresh();
    return v ? "Link Saweria disimpan." : "Link Saweria dihapus.";
  });
  const extForm = useForm(async (f) => {
    const url = f.url.value.trim(), label = f.label.value.trim();
    if (url && !httpsOk(url)) throw new Error("URL harus diawali https://");
    await api("PUT", "/api/settings", { extLink: { label, url } }); await S.refresh();
    return url ? "Tautan disimpan." : "Tautan disembunyikan.";
  });
  const ext = S.data.settings.extLink || {};

  return (
    <>
      <div className="panel" style={{ marginBottom: 20 }}>
        <h2>Pesanan Movie</h2>
        {rows.length ? (
          <div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Waktu</th><th>Pembeli</th><th>Movie</th><th>Ref</th><th>Jumlah</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
            {rows.map((o) => {
              const a = S.data.anime.find((x) => x.id === o.animeId);
              return (
                <tr key={o.id}>
                  <td>{new Date(o.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td>{o.userName || "?"}<br /><small className="muted">{o.userEmail || ""}</small></td>
                  <td>{a ? a.title : "(dihapus)"}</td><td>{o.ref}</td><td>{rupiah(o.amount)}</td>
                  <td><span className={"st-pill st-" + o.status}>{STL[o.status]}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {o.status === "PENDING" ? <><button className="tag" style={tg("#a5edc4")} onClick={() => setStatus(o.id, "PAID")}>Konfirmasi</button> <button className="tag" style={tg("#ffb3b3")} onClick={() => setStatus(o.id, "REJECTED")}>Tolak</button></>
                      : o.status === "PAID" ? <button className="tag" style={tg("#ffb3b3")} onClick={() => setStatus(o.id, "REJECTED")}>Cabut akses</button>
                      : <button className="tag" style={tg("#a5edc4")} onClick={() => setStatus(o.id, "PAID")}>Setujui</button>}
                  </td>
                </tr>
              );
            })}
          </tbody></table></div>
        ) : <p className="muted" style={{ fontSize: 13, margin: 0 }}>Belum ada pesanan movie.</p>}
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <h2>Pengaturan Pembayaran</h2><p className="muted" style={{ fontSize: 12, marginTop: 0 }}>Info ini ditampilkan kepada pembeli movie (Rp5.000 per movie, bisa diubah per movie di form Edit).</p>
        <form className="form" onSubmit={payForm.submit}>
          <div className="field"><label>Metode / rekening tujuan (mis. DANA 0812xxxx a.n. Nama)</label><input name="method" defaultValue={pay.method || ""} /></div>
          <div className="field"><label>URL gambar QRIS (opsional, HTTPS)</label><input type="url" name="qrisUrl" placeholder="https://..." defaultValue={pay.qrisUrl || ""} /></div>
          <div className="field"><label>Instruksi tambahan</label><textarea name="instructions" defaultValue={pay.instructions || ""} /></div>
          <div className="field"><label>Nomor WhatsApp admin untuk bukti bayar (format 628xxxx)</label><input name="whatsapp" inputMode="numeric" defaultValue={pay.whatsapp || ""} /></div>
          {payForm.err && <p className="notice-error">{payForm.err}</p>}{payForm.ok && <p className="notice-success">{payForm.ok}</p>}
          <button className="btn primary" disabled={payForm.busy}>Simpan Pengaturan</button>
        </form>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <h2>Donasi Saweria</h2><p className="muted" style={{ fontSize: 12, marginTop: 0 }}>Link Saweria tampil di menu Tautan Eksternal setelah disimpan. Contoh: https://saweria.co/namakamu</p>
        <form className="form" onSubmit={siteForm.submit}>
          <div className="field"><label>Link Saweria</label><input type="url" name="saweria" placeholder="https://saweria.co/namakamu" defaultValue={S.data.settings.saweria || ""} /></div>
          {siteForm.err && <p className="notice-error">{siteForm.err}</p>}{siteForm.ok && <p className="notice-success">{siteForm.ok}</p>}
          <button className="btn primary" disabled={siteForm.busy}>Simpan Link</button>
        </form>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <h2>Tautan Eksternal</h2><p className="muted" style={{ fontSize: 12, marginTop: 0 }}>Atur tautan media sosial. Donate Saweria diatur melalui panel Donasi Saweria di atas.</p>
        <form className="form" onSubmit={async (e) => { e.preventDefault(); const f=e.target; try { await api("PUT", "/api/settings", { socialLinks: { tiktok: f.tiktok.value.trim(), facebook: f.facebook.value.trim(), instagram: f.instagram.value.trim() } }); await S.refresh(); S.toast("Tautan eksternal disimpan."); } catch (err) { S.toast(err.message); } }}>
          <div className="field"><label>Akun TikTok (HTTPS)</label><input type="url" name="tiktok" placeholder="https://www.tiktok.com/@akun" defaultValue={(S.data.settings.socialLinks || {}).tiktok || ""} /></div>
          <div className="field"><label>Akun Facebook (HTTPS)</label><input type="url" name="facebook" placeholder="https://www.facebook.com/akun" defaultValue={(S.data.settings.socialLinks || {}).facebook || ""} /></div>
          <div className="field"><label>Akun Instagram (HTTPS)</label><input type="url" name="instagram" placeholder="https://www.instagram.com/akun" defaultValue={(S.data.settings.socialLinks || {}).instagram || ""} /></div>
          <button className="btn primary">Simpan Tautan Eksternal</button>
        </form>
      </div>
    </>
  );
}

export function Admin() {
  const S = useStore(); const gate = useGate(); const user = S.user;
  const addForm = useForm(async (f) => {
    const title = f.title.value.trim(), synopsis = f.synopsis.value.trim(), posterUrl = f.posterUrl.value.trim();
    if (!title || !synopsis) throw new Error("Judul dan sinopsis wajib diisi");
    if (posterUrl && !httpsOk(posterUrl)) throw new Error("URL poster harus HTTPS");
    await api("POST", "/api/anime", { title, synopsis, posterUrl: posterUrl || null, releaseYear: f.releaseYear.value ? Number(f.releaseYear.value) : null, status: "ONGOING", type: "TV", featured: f.featured.checked, genreIds: [...f.querySelectorAll("[name=genre]:checked")].map((x) => x.value) });
    await S.refresh(); f.reset();
  });
  const accForm = useForm(async (f) => {
    const name = f.name.value.trim(), email = f.email.value.trim().toLowerCase(), pw = f.password.value;
    if (name.length < 2) throw new Error("Nama minimal 2 karakter");
    if (pw && (pw.length < 8 || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw))) throw new Error("Password minimal 8 karakter dengan huruf besar, huruf kecil, dan angka");
    await api("PATCH", "/api/auth/account", { name, email, password: pw }); await S.refresh(); f.password.value = "";
    return "Akun admin disimpan.";
  });
  if (gate === "/login") return null;
  if (gate === "denied") return <main className="wrap section"><div className="panel"><h1>Akses ditolak</h1><p className="muted">Halaman ini hanya untuk admin.</p></div></main>;
  const list = [...S.data.anime].sort((a, b) => b.updatedAt - a.updatedAt), genres = [...S.data.genres].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <main className="wrap section">
      <div className="sectionhead"><div><h1 style={{ fontFamily: "'Space Grotesk'" }}>Dashboard Admin</h1><p>Kelola katalog anime dan episode.</p></div><button className="btn" type="button" onClick={S.logout}>Keluar</button></div>
      <div className="panel" style={{ marginBottom: 20 }}>
        <h2>Tambah Anime</h2>
        <form className="form" onSubmit={addForm.submit}>
          <div className="field"><label>Judul anime</label><input name="title" required /></div>
          <div className="field"><label>Sinopsis</label><textarea name="synopsis" required></textarea></div>
          <div className="field"><label>URL poster (opsional)</label><input type="url" name="posterUrl" placeholder="https://..." /></div>
          <div className="field"><label>Tahun rilis</label><input type="number" name="releaseYear" min="1900" max="2100" /></div>
          <div className="field"><label>Genre</label><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>{genres.map((g) => <label key={g.id} style={{ display: "flex", gap: 5, alignItems: "center" }}><input type="checkbox" name="genre" value={g.id} />{g.name}</label>)}</div></div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}><input type="checkbox" name="featured" /> Tampilkan di Anime Pilihan</label>
          {addForm.err && <p className="notice-error">{addForm.err}</p>}
          <button className="btn primary" disabled={addForm.busy}>Simpan Anime</button>
        </form>
      </div>
      <div className="panel" style={{ marginBottom: 20 }}>
        <h2>Mode Website Maintenance</h2>
        <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>Saat diaktifkan, pengunjung akan melihat halaman maintenance dengan latar laut dan pulau yang senada dengan intro website. Admin tetap dapat masuk ke dashboard untuk mematikan mode ini.</p>
        <form className="form" onSubmit={async (e) => {
          e.preventDefault(); const f = e.currentTarget; const enabled = f.enabled.checked; const message = f.message.value.trim();
          try { await api("PUT", "/api/settings", { maintenance: { enabled, message } }); await S.refresh(); S.toast(enabled ? "Mode maintenance diaktifkan." : "Mode maintenance dinonaktifkan."); }
          catch (err) { S.toast(err.message); }
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="checkbox" name="enabled" defaultChecked={!!(S.data.settings.maintenance && S.data.settings.maintenance.enabled)} /> Aktifkan mode maintenance</label>
          <div className="field"><label>Pesan untuk pengunjung</label><textarea name="message" maxLength={240} defaultValue={(S.data.settings.maintenance && S.data.settings.maintenance.message) || "Kami sedang melakukan pemeliharaan untuk meningkatkan pengalaman menonton."} /></div>
          <button className="btn primary">Simpan Pengaturan Maintenance</button>
        </form>
      </div>
      <OrdersPanel />
      <div className="panel" style={{ marginBottom: 20 }}>
        <h2>Akun Admin</h2><p className="muted" style={{ fontSize: 12, marginTop: 0 }}>Ganti email dan password login admin. Kosongkan password jika tidak ingin mengubahnya.</p>
        <form className="form" onSubmit={accForm.submit}>
          <div className="field"><label>Nama</label><input name="name" required defaultValue={user.name} /></div>
          <div className="field"><label>Email admin</label><input type="email" name="email" required defaultValue={user.email} /></div>
          <div className="field"><label>Password baru (minimal 8 karakter, huruf besar/kecil dan angka)</label><input type="password" name="password" autoComplete="new-password" /></div>
          {accForm.err && <p className="notice-error">{accForm.err}</p>}{accForm.ok && <p className="notice-success">{accForm.ok}</p>}
          <button className="btn primary" disabled={accForm.busy}>Simpan Akun</button>
        </form>
      </div>
      <div className="panel">
        <h2>Daftar Anime</h2>
        <div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Judul</th><th>Status</th><th>Episode</th><th>Aksi</th></tr></thead><tbody>
          {list.map((a) => (
            <tr key={a.id}>
              <td>{a.title}<br /><small className="muted">/{a.slug}</small></td><td>{a.status}</td><td>{S.epCount(a)}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                <Link className="tag" href={`/admin/anime/${a.id}`}>Kelola</Link>{" "}
                <button className="tag" style={{ background: "none", cursor: "pointer" }} onClick={() => S.openModal({ kind: "anime", id: a.id })}>Edit</button>{" "}
                <button className="tag" style={{ background: "none", cursor: "pointer", color: "#ffb3b3", borderColor: "#ffb3b366" }} onClick={() => S.deleteAnime(a.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody></table></div>
      </div>
    </main>
  );
}

export function Manage({ id }) {
  const S = useStore(); const gate = useGate();
  const a = S.data.anime.find((x) => x.id === id);
  const eps = a ? S.episodesOf(a) : [], next = (eps.length ? eps[eps.length - 1].number : 0) + 1;
  const epForm = useForm(async (f) => {
    const number = Number(f.number.value), ps = parseSourcesText(f.sources.value);
    if (!Number.isInteger(number) || number < 1) throw new Error("Nomor episode tidak valid");
    if (ps.error) throw new Error(ps.error);
    if (eps.some((x) => x.number === number)) throw new Error("Nomor episode sudah ada");
    await api("POST", `/api/anime/${id}/episodes`, { number, title: "", synopsis: "", sources: ps.list });
    await S.refresh(); f.sources.value = "";
  });
  useEffect(() => { if (gate === "denied") S.router.replace("/"); }, [gate]); // eslint-disable-line
  if (gate) return null;
  if (!a) return <NotFound />;
  const delEp = async (eid) => { if (!confirm("Hapus episode ini?")) return; try { await api("DELETE", "/api/episodes/" + eid); await S.refresh(); } catch (e) { S.toast(e.message); } };
  return (
    <main className="wrap section">
      <p className="muted"><Link href="/admin">← Dashboard</Link></p>
      <h1 style={{ fontFamily: "'Space Grotesk'" }}>{a.title}</h1>
      <div className="panel"><h2>Tambah Episode</h2>
        <form className="form" key={next} onSubmit={epForm.submit}>
          <div className="field"><label>Nomor episode</label><input type="number" name="number" min="1" required defaultValue={next} /></div>
          <div className="field"><label>Sumber video — satu per baris, format: Nama server | URL (opsional)</label>
            <textarea name="sources" placeholder={"Server 1 | https://contoh.com/episode1.mp4\nServer 2 | https://contoh.com/embed/abc123\nYouTube | https://www.youtube.com/watch?v=xxxx"}></textarea>
            <small className="muted" style={{ lineHeight: 1.6 }}>Didukung: file langsung (.mp4/.webm), HLS (.m3u8), YouTube, Google Drive (link bagikan), dan link embed dari penyedia video. Semua harus https://</small></div>
          {epForm.err && <p className="notice-error">{epForm.err}</p>}
          <button className="btn primary" disabled={epForm.busy}>Tambah Episode</button>
        </form>
      </div>
      <div className="panel" style={{ marginTop: 20 }}><h2>Episode</h2>
        {eps.map((e) => (
          <div className="episode" key={e.id}>
            <span><strong>Episode {e.number}</strong> — {e.title || "Tanpa judul"}<br /><small>{epSources(e).length ? epSources(e).length + " sumber video: " + epSources(e).map((s) => s.label).join(", ") : "Belum ada sumber video"}</small></span>
            <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => S.openModal({ kind: "source", id: e.id })}>Sumber</button><button className="btn" onClick={() => delEp(e.id)}>Hapus</button></div>
          </div>
        ))}
      </div>
    </main>
  );
}
