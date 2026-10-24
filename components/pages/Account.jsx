"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, useStore } from "../store";
import { AnimeGrid } from "../ui";
import { STL, rupiah } from "@/lib/client";

export function Login() {
  const S = useStore();
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); const f = e.target; setBusy(true); setErr("");
    try {
      const { user } = await api("POST", "/api/auth/login", { email: f.email.value.trim().toLowerCase(), password: f.password.value });
      await S.refresh(); S.router.push("/");
      if (user.role === "ADMIN") S.toast("✓ Mode admin aktif — pakai tombol ⚙ Mode Admin di kanan bawah");
    } catch (ex) { setErr(ex.message); setBusy(false); }
  };
  return (
    <main className="wrap section">
      <div className="panel" style={{ maxWidth: 500, margin: "25px auto" }}>
        <h1 style={{ fontFamily: "'Space Grotesk'" }}>Masuk SHIAQTANIME</h1>
        <p className="muted" style={{ fontSize: 13 }}>Masuk untuk menyimpan daftar anime dan riwayat tontonan.</p>
        <form className="form" onSubmit={submit}>
          <div className="field"><label>Email</label><input type="email" name="email" required autoComplete="email" /></div>
          <div className="field"><label>Password</label><input type="password" name="password" required autoComplete="current-password" /></div>
          {err && <p className="notice-error">{err}</p>}
          <button className="btn primary" disabled={busy}>{busy ? "Memproses..." : "Masuk"}</button>
        </form>
        <p className="muted" style={{ fontSize: 12, marginTop: 18 }}>Belum punya akun? <Link href="/register" style={{ color: "var(--gold)" }}>Daftar di sini</Link></p>
      </div>
    </main>
  );
}

export function Register() {
  const S = useStore();
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); const f = e.target; setBusy(true); setErr("");
    const fail = (m) => { setErr(m); setBusy(false); };
    const name = f.name.value.trim(), email = f.email.value.trim().toLowerCase(), pw = f.password.value;
    if (name.length < 2) return fail("Nama minimal 2 karakter");
    if (pw.length < 8 || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return fail("Password minimal 8 karakter dengan huruf besar, huruf kecil, dan angka");
    try { await api("POST", "/api/auth/register", { name, email, password: pw }); await S.refresh(); S.router.push("/"); } catch (ex) { fail(ex.message); }
  };
  return (
    <main className="wrap section">
      <div className="panel" style={{ maxWidth: 500, margin: "25px auto" }}>
        <h1 style={{ fontFamily: "'Space Grotesk'" }}>Buat Akun</h1>
        <p className="muted" style={{ fontSize: 13 }}>Daftar untuk menggunakan daftar tontonan.</p>
        <form className="form" onSubmit={submit}>
          <div className="field"><label>Nama</label><input name="name" required minLength={2} /></div>
          <div className="field"><label>Email</label><input type="email" name="email" required /></div>
          <div className="field"><label>Password (minimal 8 karakter, huruf besar/kecil dan angka)</label><input type="password" name="password" required minLength={8} /></div>
          {err && <p className="notice-error">{err}</p>}
          <button className="btn primary" disabled={busy}>{busy ? "Memproses..." : "Daftar"}</button>
        </form>
      </div>
    </main>
  );
}

export function MyList() {
  const S = useStore(); const user = S.user;
  useEffect(() => { if (!user) S.router.replace("/login"); }, [user]); // eslint-disable-line
  if (!user) return null;
  const rows = S.data.watchlist.filter((w) => w.userId === user.id).sort((a, b) => b.createdAt - a.createdAt).map((w) => S.data.anime.find((a) => a.id === w.animeId)).filter(Boolean);
  const orders = S.data.orders.filter((o) => o.userId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  return (
    <main className="wrap section">
      <div className="sectionhead"><div><h2>Daftar Saya</h2><p>Anime yang kamu simpan.</p></div><button className="btn" onClick={S.logout}>Keluar</button></div>
      <AnimeGrid list={rows} />
      {orders.length > 0 && (
        <>
          <div className="sectionhead" style={{ marginTop: 34 }}><div><h2>Pesanan Movie Saya</h2><p>Status pembelian movie anime layar lebar.</p></div></div>
          <div className="episode-list">
            {orders.map((o) => {
              const a = S.data.anime.find((x) => x.id === o.animeId), ep = a && S.data.episodes.find((e) => e.animeId === a.id);
              return (
                <div className="episode" key={o.id}>
                  <span><strong>{a ? a.title : "(movie dihapus)"}</strong><br /><small>{rupiah(o.amount)} · Ref {o.ref} · {new Date(o.createdAt).toLocaleDateString("id-ID")}</small></span>
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}><span className={"st-pill st-" + o.status}>{STL[o.status]}</span>{o.status === "PAID" && ep && <Link className="btn primary" href={`/watch/${ep.id}`}>▶ Tonton</Link>}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
