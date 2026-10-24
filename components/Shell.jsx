"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, useStore } from "./store";
import { LOGO } from "@/lib/assets";
import { Modals } from "./modals";

/* ===== Intro ===== */
export function Intro() {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem("shiaqtanime_intro_seen") === "1") { setHide(true); return; } sessionStorage.setItem("shiaqtanime_intro_seen", "1"); } catch (e) {}
    const t = setTimeout(() => setHide(true), 1900); return () => clearTimeout(t);
  }, []);
  return (
    <div id="siteIntro" className={hide ? "hide" : ""} role="status" aria-label="Memuat SHIAQTANIME" onClick={() => setHide(true)}>
      <div className="intro-horizon" aria-hidden="true"></div>
      <div className="intro-ocean" aria-hidden="true">
        <svg viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="seaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#17465a" stopOpacity=".28" /><stop offset="1" stopColor="#06101a" stopOpacity=".95" /></linearGradient>
            <linearGradient id="islandFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#244b51" /><stop offset="1" stopColor="#0a1a24" /></linearGradient>
          </defs>
          <path className="wave-back" d="M0 176 C170 145 260 196 430 174 S730 151 900 180 S1220 147 1440 175 L1440 520 L0 520Z" fill="url(#seaFill)" />
          <path d="M0 230 C170 208 300 247 470 224 S770 207 940 231 S1260 205 1440 226" fill="none" stroke="#67c9dc" strokeOpacity=".16" strokeWidth="2" />
          <path d="M0 275 C190 251 300 290 500 268 S830 251 1020 277 S1280 253 1440 270" fill="none" stroke="#67c9dc" strokeOpacity=".12" strokeWidth="1.5" />
          <path className="wave-front" d="M0 310 C190 275 340 335 520 307 S830 281 1010 313 S1280 284 1440 305 L1440 520 L0 520Z" fill="#081923" fillOpacity=".8" />
          <path d="M0 350 C180 331 360 366 550 347 S890 330 1080 351 S1280 337 1440 349" fill="none" stroke="#3e9db5" strokeOpacity=".15" strokeWidth="1.5" />
          <path d="M0 405 C200 388 370 419 590 400 S930 386 1130 405 S1300 393 1440 402" fill="none" stroke="#3e9db5" strokeOpacity=".1" strokeWidth="1" />
          <path d="M0 520 L0 190 C85 190 124 171 170 177 C210 183 231 156 268 162 C301 167 317 191 357 188 C396 185 418 211 450 220 L0 265Z" fill="url(#islandFill)" opacity=".92" />
          <path d="M1440 520 L1440 171 C1366 177 1328 152 1286 162 C1245 172 1215 150 1175 164 C1135 178 1117 197 1071 193 C1036 190 1006 211 978 225 L1440 265Z" fill="url(#islandFill)" opacity=".82" />
          <path d="M0 228 C140 208 220 215 340 226 M1440 223 C1310 204 1220 213 1100 227" fill="none" stroke="#6bb8c4" strokeOpacity=".15" strokeWidth="2" />
        </svg>
      </div>
      <div className="intro-content">
        <img id="introLogo" className="intro-logo" alt="Logo SHIAQTANIME" src={LOGO} />
        <div className="intro-kicker">Anime discovery platform</div>
        <h1 className="intro-name">SHIAQT<span>ANIME</span></h1>
        <div className="intro-line"></div>
        <div className="intro-tagline">Temukan cerita berikutnya</div>
        <div className="intro-loading" aria-hidden="true"></div>
      </div>
    </div>
  );
}

/* ===== Header ===== */
export function Header() {
  const S = useStore();
  const { router } = S;
  const clicks = useRef({ c: 0, t: null });
  const socials = (S.data.settings && S.data.settings.socialLinks) || {};
  const extItems = [{ label: "Donate Saweria", url: S.data.settings.saweria }, { label: "TikTok", url: socials.tiktok }, { label: "Facebook", url: socials.facebook }, { label: "Instagram", url: socials.instagram }].filter((x) => x.url && /^https:\/\//i.test(x.url));

  const brandClick = (e) => {
    const k = clicks.current; k.c++; clearTimeout(k.t); k.t = setTimeout(() => { k.c = 0; }, 2500);
    if (k.c >= 5) { k.c = 0; e.preventDefault(); router.push(S.isAdmin ? "/admin" : "/login"); }
  };
  const search = (e) => {
    e.preventDefault(); const q = e.target.q.value.trim();
    router.push("/anime" + (q ? "?q=" + encodeURIComponent(q) : "")); e.target.reset();
  };
  useEffect(() => {
    const h = (e) => { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") { e.preventDefault(); router.push(S.isAdmin ? "/admin" : "/login"); } };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, [router, S.isAdmin]);

  const title = S.user ? "Daftar Saya — " + S.user.name : "Masuk / Daftar Saya";
  return (
    <header className="topbar"><div className="wrap nav">
      <Link className="brand" href="/" onClick={brandClick}>
        <img id="brandLogo" src={LOGO} alt="Logo SHIAQTHERA" width="45" height="45" />
        <span><strong>SHIAQTANIME</strong><small>ANIME UNIVERSE</small></span>
      </Link>
      <nav className="navlinks">
        <Link href="/">Beranda</Link><Link href="/anime">Katalog Anime</Link><Link href="/sedang-tayang">Sedang Tayang</Link><Link href="/selesai-tayang">Selesai Tayang</Link><Link href="/film">Movie Anime</Link><Link href="/jadwal">Jadwal Rilis</Link><Link href="/musim">Musim Ini</Link>
        <Link href="/faq">FAQ</Link>
        <div className="external-links"><button type="button" className="external-trigger" aria-haspopup="true">Tautan Eksternal⌄</button><div className="external-menu">{extItems.length ? extItems.map((item) => <a key={item.label} href={item.url} target="_blank" rel="noopener noreferrer">{item.label} ↗</a>) : <span>Link belum diatur</span>}</div></div>
      </nav>
      <form className="search" onSubmit={search}><input name="q" placeholder="Cari anime..." aria-label="Cari anime" /></form>
      <Link className={"navicon" + (S.user ? " on" : "")} href="/my-list" title={title} aria-label={title}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
      </Link>
    </div></header>
  );
}

/* ===== Strip admin / user ===== */
export function AdminStrip() {
  const S = useStore(); const u = S.user; if (!u) return null;
  if (u.role === "ADMIN") return (
    <div className="astrip"><div className="wrap in">
      <span>⚙ MODE ADMIN AKTIF — {u.email}</span><span className="sp"></span>
      <button onClick={() => S.openModal({ kind: "anime" })}>＋ Tambah Anime</button>
      <button onClick={() => S.openModal({ kind: "anime", preset: "MOVIE" })}>＋ Tambah Movie</button>
      {S.pendingOrders ? <Link href="/admin">💰 {S.pendingOrders} pesanan baru</Link> : null}
      <Link href="/admin">Dashboard</Link><button onClick={S.logout}>Keluar</button>
    </div></div>
  );
  return (
    <div className="astrip user"><div className="wrap in">
      <span>Masuk sebagai {u.name} — akun biasa, bukan admin. Untuk mode admin masuk dengan akun admin.</span><span className="sp"></span>
      <button onClick={S.logout}>Keluar</button>
    </div></div>
  );
}

/* ===== Footer ===== */
export function Footer() {
  return (
    <footer className="footer"><div className="wrap footer-row">
      <div><strong>SHIAQTANIME</strong><p>Anime Universe · Katalog dan daftar tontonan.</p></div>
      <div style={{ textAlign: "right" }}>Hak Cipta © 2026 SHIAQTANIME. Seluruh hak dilindungi.<br />Versi 1.00</div>
    </div></footer>
  );
}

/* ===== Tombol melayang admin ===== */
export function Fab() {
  const S = useStore(); const [open, setOpen] = useState(false); const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, []);
  if (!S.isAdmin) return null;
  const m = S.pathname.match(/^\/anime\/([^/]+)$/), a = m ? S.data.anime.find((x) => x.slug === decodeURIComponent(m[1])) : null;
  return (
    <div className={"fab" + (open ? " open" : "")} id="fab" ref={ref}>
      <div className="menu" onClick={() => setOpen(false)}>
        <button onClick={() => S.openModal({ kind: "anime" })}>＋ Tambah Anime</button>
        {a && <><hr /><button onClick={() => S.openModal({ kind: "anime", id: a.id })}>✎ Edit anime ini</button><Link href={`/admin/anime/${a.id}`}>＋ Kelola episode</Link><button onClick={() => S.deleteAnime(a.id)}>🗑 Hapus anime ini</button></>}
        <hr /><Link href="/admin">Dashboard</Link><button onClick={S.logout}>Keluar</button>
      </div>
      <button type="button" aria-label="Menu Admin" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>⚙ Mode Admin</button>
    </div>
  );
}

/* ===== Toast ===== */
export function Toast() {
  const S = useStore(); const t = S.toastState; if (!t) return null;
  return (
    <div className="toast">{t.msg}
      {t.undo && <button type="button" style={{ marginLeft: 12, border: 0, borderRadius: 99, padding: "5px 11px", background: "#141622", color: "var(--gold)", fontWeight: 700, fontSize: 12, cursor: "pointer" }} onClick={() => { S.clearToast(); t.undo(); }}>↩ Batalkan</button>}
    </div>
  );
}

/* ===== Ruang Ngobrol ===== */
const NICK_KEY = "shiaqtanime_nick_v1", GID_KEY = "shiaqtanime_gid_v1";
function guestId() {
  try { let g = localStorage.getItem(GID_KEY); if (!g) { g = "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9); localStorage.setItem(GID_KEY, g); } return g; } catch (e) { return "guest"; }
}
export function Chat() {
  const S = useStore(); const u = S.user, admin = S.isAdmin;
  const [open, setOpen] = useState(false), [msgs, setMsgs] = useState([]), [seenT, setSeenT] = useState(0), [nick, setNick] = useState(""), [text, setText] = useState(""), [nickPh, setNickPh] = useState("Nama panggilan");
  const listRef = useRef(null), stick = useRef(true), nickRef = useRef(null), textRef = useRef(null), lastSend = useRef(0);
  const me = u ? u.id : (typeof window !== "undefined" ? guestId() : "guest");

  const load = async () => { try { const j = await api("GET", "/api/chat"); setMsgs(j.messages); } catch (e) {} };
  useEffect(() => { try { setNick(localStorage.getItem(NICK_KEY) || ""); } catch (e) {} }, []);
  useEffect(() => { load(); const t = setInterval(load, open ? 4000 : 15000); return () => clearInterval(t); }, [open]);
  useEffect(() => { if (open && msgs.length) setSeenT(msgs[msgs.length - 1].t); }, [open, msgs]);
  useEffect(() => { const l = listRef.current; if (open && l && stick.current) l.scrollTop = l.scrollHeight; }, [msgs, open]);

  const toggle = () => { setOpen((o) => !o); stick.current = true; setTimeout(() => { const i = u || nick ? textRef.current : nickRef.current; if (i) i.focus(); }, 30); };
  const onScroll = () => { const l = listRef.current; if (l) stick.current = l.scrollHeight - l.scrollTop - l.clientHeight < 60; };
  const send = async (e) => {
    e.preventDefault();
    const t = text.replace(/\s+/g, " ").trim().slice(0, 300); if (!t) return;
    const n = u ? u.name : nick.replace(/\s+/g, " ").trim().slice(0, 20);
    if (!u && n.length < 2) { setNickPh("Isi nama panggilan (min. 2 huruf)"); nickRef.current && nickRef.current.focus(); return; }
    if (Date.now() - lastSend.current < 1500) return; lastSend.current = Date.now();
    if (!u) { try { localStorage.setItem(NICK_KEY, n); } catch (x) {} }
    try { await api("POST", "/api/chat", { text: t, nick: n, senderId: me }); setText(""); stick.current = true; await load(); } catch (x) { S.toast(x.message); }
  };
  const clearAll = async () => { if (admin && confirm("Hapus semua obrolan?")) { try { await api("DELETE", "/api/chat"); await load(); } catch (x) { S.toast(x.message); } } };
  const delOne = async (id) => { if (!admin) return; try { await api("DELETE", "/api/chat/" + id); await load(); } catch (x) { S.toast(x.message); } };

  const unread = open ? 0 : msgs.filter((m) => m.t > seenT).length;
  return (
    <div className="chatw" id="chatw">
      <div className="chat-panel" id="chatPanel" hidden={!open}>
        <div className="chat-head"><div><strong>Ruang Ngobrol</strong><small>Ngobrol bareng sesama penonton</small></div>
          <div style={{ display: "flex", gap: 6 }}><button type="button" hidden={!admin} onClick={clearAll}>Bersihkan</button><button type="button" aria-label="Tutup" onClick={() => setOpen(false)}>✕</button></div></div>
        <div className="chat-list" ref={listRef} onScroll={onScroll}>
          {msgs.length ? msgs.map((m) => (
            <div key={m.id} className={"cmsg" + (m.uid === me ? " me" : "")}>
              <div className="who"><span>{m.name}</span>{m.role === "ADMIN" && <span className="adbadge">Admin</span>}<span>{new Date(m.t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".")}</span>{admin && <button className="cdel" title="Hapus pesan" onClick={() => delOne(m.id)}>hapus</button>}</div>
              <div className="bub">{m.text}</div>
            </div>
          )) : <div className="chat-empty">Belum ada obrolan.<br />Jadilah yang pertama menyapa! 👋</div>}
        </div>
        <form className="chat-form" autoComplete="off" onSubmit={send}>
          <input name="nick" ref={nickRef} hidden={!!u} placeholder={nickPh} maxLength={20} value={nick} onChange={(e) => setNick(e.target.value)} />
          <div className="chat-row"><input name="text" ref={textRef} placeholder="Tulis pesan..." maxLength={300} required value={text} onChange={(e) => setText(e.target.value)} /><button className="btn primary">Kirim</button></div>
        </form>
        <div className="chat-note">Obrolan tersimpan di server dan terlihat oleh semua penonton. Jaga sopan santun ya 🙏</div>
      </div>
      <button className="chat-fab" id="chatFab" type="button" aria-label="Buka Ruang Ngobrol" onClick={toggle}>💬<span className="chat-badge" id="chatBadge" hidden={!unread}>{unread > 9 ? "9+" : unread}</span></button>
    </div>
  );
}

export function MaintenanceScreen() {
  const S = useStore();
  const info = (S.data && S.data.settings && S.data.settings.maintenance) || {};
  useEffect(() => {
    const handleAdminShortcut = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        S.router.push("/login");
      }
    };
    document.addEventListener("keydown", handleAdminShortcut);
    return () => document.removeEventListener("keydown", handleAdminShortcut);
  }, [S.router]);
  return (
    <main className="maintenance-screen" role="main">
      <div className="maintenance-horizon" aria-hidden="true" />
      <div className="maintenance-ocean" aria-hidden="true">
        <svg viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="maintenanceSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#17465a" stopOpacity=".28"/><stop offset="1" stopColor="#06101a" stopOpacity=".95"/></linearGradient>
            <linearGradient id="maintenanceIsland" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#244b51"/><stop offset="1" stopColor="#0a1a24"/></linearGradient>
          </defs>
          <path className="maintenance-wave-back" d="M0 176 C170 145 260 196 430 174 S730 151 900 180 S1220 147 1440 175 L1440 520 L0 520Z" fill="url(#maintenanceSea)"/>
          <path d="M0 230 C170 208 300 247 470 224 S770 207 940 231 S1260 205 1440 226" fill="none" stroke="#67c9dc" strokeOpacity=".16" strokeWidth="2"/>
          <path d="M0 275 C190 251 300 290 500 268 S830 251 1020 277 S1280 253 1440 270" fill="none" stroke="#67c9dc" strokeOpacity=".12" strokeWidth="1.5"/>
          <path className="maintenance-wave-front" d="M0 310 C190 275 340 335 520 307 S830 281 1010 313 S1280 284 1440 305 L1440 520 L0 520Z" fill="#081923" fillOpacity=".8"/>
          <path d="M0 520 L0 190 C85 190 124 171 170 177 C210 183 231 156 268 162 C301 167 317 191 357 188 C396 185 418 211 450 220 L0 265Z" fill="url(#maintenanceIsland)" opacity=".92"/>
          <path d="M1440 520 L1440 171 C1366 177 1328 152 1286 162 C1245 172 1215 150 1175 164 C1135 178 1117 197 1071 193 C1036 190 1006 211 978 225 L1440 265Z" fill="url(#maintenanceIsland)" opacity=".82"/>
        </svg>
      </div>
      <section className="maintenance-content">
        <img className="maintenance-logo" src={LOGO} alt="Logo SHIAQTANIME" />
        <p className="intro-kicker">SHIAQTANIME · SYSTEM NOTICE</p>
        <h1 className="intro-name">Sedang <span>Maintenance</span></h1>
        <div className="intro-line" />
        <p className="maintenance-message">{info.message || "Kami sedang melakukan pemeliharaan untuk meningkatkan pengalaman menonton."}</p>
        <div className="maintenance-status"><span /> PEMELIHARAAN SISTEM BERLANGSUNG</div>
        <p className="maintenance-foot">Mohon kembali beberapa saat lagi. Terima kasih atas pengertiannya.</p>
      </section>
    </main>
  );
}

export function Frame({ children }) {
  const S = useStore();
  const maintenance = !!(S.data && S.data.settings && S.data.settings.maintenance && S.data.settings.maintenance.enabled);
  if (maintenance && !S.isAdmin && S.pathname !== "/login") return <MaintenanceScreen />;
  return (<><Header /><AdminStrip /><div id="app">{children}</div><Footer /><Fab /><Chat /><Toast /><Modals /></>);
}
