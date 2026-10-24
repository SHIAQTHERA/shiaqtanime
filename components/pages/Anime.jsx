"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, useStore } from "../store";
import { NotFound } from "../ui";
import { openBuy } from "../modals";
import { cssUrl, detectSource, epSources, fmtDate as fmtDateSafe, isMovie, moviePrice, rupiah } from "@/lib/client";
import { translateSynopsisToId } from "@/lib/anilist";
import { WATERMARK_LOGO } from "@/lib/assets";

/* ===== Detail anime ===== */
export function Detail({ slug }) {
  const S = useStore();
  const a = S.data.anime.find((x) => x.slug === slug);
  const [syn, setSyn] = useState(a ? a.synopsis : "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setSyn(a ? a.synopsis : ""); setMsg(""); }, [a && a.id, a && a.synopsis]); // eslint-disable-line
  useEffect(() => {
    if (!a || !a.synopsis) return;
    let alive = true;
    translateSynopsisToId(a.synopsis).then((text) => {
      if (!alive || !text || text === a.synopsis) return;
      setSyn(text);
      if (S.isAdmin) api("PATCH", "/api/anime/" + a.id, { synopsis: text }).then(() => S.refresh()).catch(() => {});
    });
    return () => { alive = false; };
  }, [a && a.id]); // eslint-disable-line

  if (!a) return <NotFound />;
  const eps = S.episodesOf(a), user = S.user;
  const saved = !!(user && S.data.watchlist.some((w) => w.userId === user.id && w.animeId === a.id));
  const movie = isMovie(a);
  const bg = a.posterUrl ? { backgroundImage: `linear-gradient(#0002,#0005),url("${cssUrl(a.posterUrl)}")` } : {};

  const toggleWl = async () => {
    if (!user) { S.router.push("/login"); return; }
    setBusy(true);
    try { const r = await api("POST", "/api/watchlist", { animeId: a.id }); setMsg(r.saved ? "Ditambahkan ke daftar saya." : "Dihapus dari daftar saya."); await S.refresh(); } catch (e) { setMsg(e.message); }
    setBusy(false);
  };

  let movieBox = null;
  if (movie) {
    const ep = eps[0], o = user ? S.orderOf(user, a) : null;
    let cta;
    if (!ep) cta = <div className="muted" style={{ fontSize: 13 }}>Movie ini belum memiliki berkas tayang. Admin perlu menambahkannya.</div>;
    else if (S.hasAccess(a)) cta = <Link className="btn primary" href={`/watch/${ep.id}`}>▶ Tonton Movie</Link>;
    else if (o && o.status === "PENDING") cta = <button className="btn" onClick={() => openBuy(S, a.id)}>⏳ Menunggu konfirmasi pembayaran</button>;
    else cta = <button className="btn primary" onClick={() => openBuy(S, a.id)}>🎟 Beli & Tonton — {rupiah(moviePrice(a))}</button>;
    movieBox = (
      <div className="panel" style={{ marginTop: 26 }}>
        <div className="eyebrow">MOVIE ANIME LAYAR LEBAR</div>
        <h2 style={{ fontFamily: "'Space Grotesk'", margin: "10px 0 6px" }}>Tonton Movie</h2>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.8, marginTop: 0 }}>Movie ini berbayar <b style={{ color: "var(--gold)" }}>{rupiah(moviePrice(a))}</b> per movie. Setelah pembayaran dikonfirmasi admin, movie bisa ditonton kapan saja dari akun Anda.</p>
        <div className="actions" style={{ marginTop: 12 }}>{cta}</div>
      </div>
    );
  }

  return (
    <main className="wrap section">
      <div className="detail-layout">
        <div><div className="detail-poster" style={{ ...bg, backgroundSize: "cover", backgroundPosition: "center", display: "grid", placeItems: "center" }}>{!a.posterUrl && <span style={{ fontSize: 80 }}>✦</span>}</div></div>
        <div>
          <div className="eyebrow">ANIME DETAILS</div>
          <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: "clamp(30px,4vw,44px)", margin: "12px 0" }}>{a.title}</h1>
          {a.alternative && <p className="muted">{a.alternative}</p>}
          <div style={{ margin: "14px 0" }}>{S.genresOf(a).map((g) => <span key={g.id} className="tag">{g.name}</span>)}</div>
          <p className="muted" id="animeSynopsis" style={{ fontSize: 13, lineHeight: 1.9 }}>{syn}</p>
          <div className="meta" style={{ justifyContent: "flex-start", gap: 18, fontSize: 12, margin: "18px 0" }}>
            <span>Tahun: {a.releaseYear ?? "—"}</span><span>Status: {a.status}</span>{a.airDate && <span>Tayang: {fmtDateSafe(a.airDate)}</span>}<span className="rating">★ {a.rating ? a.rating : "—"}</span>
            <span>{movie ? "🎬 Movie · " + rupiah(moviePrice(a)) : eps.length + " episode"}</span>
          </div>
          {S.isAdmin && (
            <div className="actions" style={{ margin: "0 0 16px" }}>
              <button className="btn primary" onClick={() => S.openModal({ kind: "anime", id: a.id })}>✎ Edit Anime</button>
              <Link className="btn" href={`/admin/anime/${a.id}`}>＋ Tambah / Kelola Episode</Link>
              <button className="btn" onClick={() => S.deleteAnime(a.id)}>🗑 Hapus Anime</button>
            </div>
          )}
          <div><button className="btn primary" id="wlBtn" onClick={toggleWl} disabled={busy}>{saved ? "✓ Tersimpan — Hapus" : "＋ Tambah ke Daftar Saya"}</button><p className="muted" id="wlMsg" style={{ fontSize: 12 }}>{msg}</p></div>
          {movie ? movieBox : (
            <>
              <h2 style={{ fontFamily: "'Space Grotesk'", marginTop: 30 }}>Daftar Episode</h2>
              <div className="episode-list">
                {eps.length ? eps.map((ep) => (
                  <Link key={ep.id} className="episode" href={`/watch/${ep.id}`}><span><strong>Episode {ep.number}</strong><br /><small>{ep.title || "Episode " + ep.number}</small></span><span>▶ Putar</span></Link>
                )) : <div className="panel muted">Episode belum ditambahkan oleh admin.</div>}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

/* ===== Pemutar ===== */
let hlsLoading = null;
function loadHls() {
  if (window.Hls) return Promise.resolve();
  return hlsLoading || (hlsLoading = new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.8/hls.min.js";
    s.onload = res; s.onerror = () => { hlsLoading = null; rej(); }; document.head.appendChild(s);
  }));
}
const fmtT = (s) => {
  s = Math.max(0, Math.floor(isFinite(s) ? s : 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0");
};
const Ic = {
  play: <svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z" /></svg>,
  pause: <svg viewBox="0 0 24 24"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z" /></svg>,
  back: <svg viewBox="0 0 24 24"><path d="M11 6v12l-8.5-6zM21 6v12l-8.5-6z" /></svg>,
  fwd: <svg viewBox="0 0 24 24"><path d="M13 6v12l8.5-6zM3 6v12l8.5-6z" /></svg>,
  vol: <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9zM15.5 8.5a5 5 0 0 1 0 7l-1.4-1.4a3 3 0 0 0 0-4.2zM18.4 5.6a9 9 0 0 1 0 12.8L17 17a7 7 0 0 0 0-10z" /></svg>,
  mute: <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9zM16 9.6l1.4-1.4 2.1 2.1 2.1-2.1L23 9.6 20.9 11.7 23 13.8l-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2.1z" /></svg>,
  gear: <svg viewBox="0 0 24 24"><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.5 7.5 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.5 7.5 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.5 7.5 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.5 7.5 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)" /></svg>,
  pip: <svg viewBox="0 0 24 24"><path d="M19 4h-7v2h5.6L9 14.6 10.4 16 19 7.4V13h2V4zM5 6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3h-2v3H5V8h3V6z" /></svg>,
  fs: <svg viewBox="0 0 24 24"><path d="M4 4h6v2H6v4H4zM14 4h6v6h-2V6h-4zM4 14h2v4h4v2H4zM18 14h2v6h-6v-2h4z" /></svg>,
  fsx: <svg viewBox="0 0 24 24"><path d="M8 4h2v6H4V8h4zM14 4h2v4h4v2h-6zM4 14h6v6H8v-4H4zM14 14h6v2h-4v4h-2z" /></svg>,
};
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function Player({ source }) {
  const d = detectSource(source.url), vref = useRef(null), sref = useRef(null), hlsRef = useRef(null), idle = useRef(null);
  const [hlsErr, setHlsErr] = useState(false), [levels, setLevels] = useState([]), [level, setLevel] = useState(-1);
  const [playing, setPlaying] = useState(false), [cur, setCur] = useState(0), [dur, setDur] = useState(0), [buf, setBuf] = useState(0);
  const [vol, setVol] = useState(1), [muted, setMuted] = useState(false), [rate, setRate] = useState(1);
  const [menu, setMenu] = useState(false), [fs, setFs] = useState(false), [active, setActive] = useState(true), [wait, setWait] = useState(false);
  const canPip = typeof document !== "undefined" && !!document.pictureInPictureEnabled;

  useEffect(() => {
    setHlsErr(false); setLevels([]); setLevel(-1);
    if (d.type !== "hls") return;
    const v = vref.current; if (!v) return;
    let inst = null, alive = true;
    if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = d.src; return; }
    loadHls().then(() => {
      if (!alive) return;
      if (window.Hls && window.Hls.isSupported()) {
        inst = new window.Hls(); hlsRef.current = inst;
        inst.on(window.Hls.Events.MANIFEST_PARSED, (_, data) => { if (alive) setLevels((data.levels || []).map((l, i) => ({ i, h: l.height })).filter((l) => l.h)); });
        inst.loadSource(d.src); inst.attachMedia(v);
      } else v.src = d.src;
    }).catch(() => { if (alive) setHlsErr(true); });
    return () => { alive = false; hlsRef.current = null; if (inst) inst.destroy(); };
  }, [d.type, d.src]);

  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => { document.removeEventListener("fullscreenchange", on); clearTimeout(idle.current); };
  }, []);

  if (d.type === "iframe") return <iframe title="Pemutar video anime" src={d.src} style={{ width: "100%", height: "100%", border: 0 }} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-presentation allow-forms" />;
  if (hlsErr) return <div className="player-error"><p>Gagal memuat pemutar HLS. Periksa koneksi internet atau coba server lain.</p></div>;

  const V = () => vref.current;
  const toggle = () => { const v = V(); if (!v) return; if (v.paused) v.play().catch(() => setPlaying(false)); else v.pause(); };
  const skip = (s) => { const v = V(); if (v) v.currentTime = Math.min(Math.max(0, v.currentTime + s), v.duration || 1e9); };
  const seek = (e) => { const v = V(); if (v) { v.currentTime = +e.target.value; setCur(+e.target.value); } };
  const setVolume = (x) => { const v = V(); if (!v) return; v.volume = x; v.muted = x === 0; };
  const toggleMute = () => { const v = V(); if (!v) return; v.muted = !v.muted; if (!v.muted && v.volume === 0) v.volume = 0.5; };
  const pip = async () => { const v = V(); try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else await v.requestPictureInPicture(); } catch (e) {} };
  const fullscreen = () => {
    const box = sref.current && (sref.current.closest(".cinema-player") || sref.current), v = V();
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (box && box.requestFullscreen) box.requestFullscreen().catch(() => {});
    else if (v && v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  };
  const changeRate = (r) => { const v = V(); if (v) v.playbackRate = r; };
  const changeLevel = (i) => { setLevel(i); if (hlsRef.current) hlsRef.current.currentLevel = i; };
  const wake = () => {
    setActive(true); clearTimeout(idle.current);
    idle.current = setTimeout(() => setActive(false), 2800);
  };
  const onKey = (e) => {
    const k = e.key;
    if (k === " " || k === "k") { e.preventDefault(); toggle(); }
    else if (k === "ArrowLeft") { e.preventDefault(); skip(-10); }
    else if (k === "ArrowRight") { e.preventDefault(); skip(10); }
    else if (k === "ArrowUp") { e.preventDefault(); setVolume(Math.min(1, (V()?.volume || 0) + 0.1)); }
    else if (k === "ArrowDown") { e.preventDefault(); setVolume(Math.max(0, (V()?.volume || 0) - 0.1)); }
    else if (k === "m") toggleMute();
    else if (k === "f") fullscreen();
    wake();
  };
  const pct = dur ? (cur / dur) * 100 : 0, bpct = dur ? (buf / dur) * 100 : 0, shown = vol * 100, hide = playing && !active && !menu;

  return (
    <div ref={sref} className={"video-stage" + (hide ? " vc-hidden" : "")} tabIndex={0} onKeyDown={onKey} onMouseMove={wake} onTouchStart={wake} onMouseLeave={() => playing && setActive(false)}>
      <video
        ref={vref}
        playsInline
        preload="metadata"
        onClick={() => { if (menu) setMenu(false); else toggle(); }}
        onDoubleClick={fullscreen}
        onPlay={() => { setPlaying(true); wake(); }}
        onPause={() => { setPlaying(false); setActive(true); }}
        onEnded={() => { setPlaying(false); setActive(true); }}
        onTimeUpdate={(e) => setCur(e.target.currentTime)}
        onLoadedMetadata={(e) => setDur(e.target.duration || 0)}
        onDurationChange={(e) => setDur(e.target.duration || 0)}
        onProgress={(e) => { const v = e.target, b = v.buffered; if (b.length) setBuf(b.end(b.length - 1)); }}
        onVolumeChange={(e) => { setVol(e.target.volume); setMuted(e.target.muted); }}
        onRateChange={(e) => setRate(e.target.playbackRate)}
        onWaiting={() => setWait(true)}
        onPlaying={() => setWait(false)}
        onCanPlay={() => setWait(false)}
        src={d.type === "video" ? d.src : undefined}
      >Browser tidak mendukung video.</video>
      {wait && playing && <div className="vc-spin" aria-hidden="true" />}
      {!playing && <button type="button" className="video-center-play" aria-label="Putar video" onClick={toggle}><span aria-hidden="true">▶</span></button>}
      {menu && (
        <div className="vc-menu" role="menu">
          <b>Kecepatan</b>
          {SPEEDS.map((r) => <button key={r} type="button" className={r === rate ? "on" : ""} onClick={() => changeRate(r)}>{r === 1 ? "Normal" : r + "x"}</button>)}
          {levels.length > 1 && <><b>Kualitas</b>
            <button type="button" className={level === -1 ? "on" : ""} onClick={() => changeLevel(-1)}>Otomatis</button>
            {levels.slice().sort((a, b) => b.h - a.h).map((l) => <button key={l.i} type="button" className={level === l.i ? "on" : ""} onClick={() => changeLevel(l.i)}>{l.h}p</button>)}</>}
        </div>
      )}
      <div className="vc-bar" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="vc-btn" aria-label={playing ? "Jeda" : "Putar"} onClick={toggle}>{playing ? Ic.pause : Ic.play}</button>
        <button type="button" className="vc-btn" aria-label="Mundur 10 detik" title="Mundur 10 detik" onClick={() => skip(-10)}>{Ic.back}</button>
        <input className="vc-range vc-seek" type="range" min="0" max={dur || 0} step="0.1" value={cur} onChange={seek} aria-label="Posisi video" style={{ "--p": pct + "%", "--b": bpct + "%" }} />
        <span className="vc-time" aria-label="Sisa waktu">-{fmtT(dur - cur)}</span>
        <button type="button" className="vc-btn" aria-label="Maju 10 detik" title="Maju 10 detik" onClick={() => skip(10)}>{Ic.fwd}</button>
        <button type="button" className="vc-btn vc-mute" aria-label={muted ? "Aktifkan suara" : "Bisukan"} onClick={toggleMute}>{muted || vol === 0 ? Ic.mute : Ic.vol}</button>
        <input className="vc-range vc-vol" type="range" min="0" max="1" step="0.05" value={muted ? 0 : vol} onChange={(e) => setVolume(+e.target.value)} aria-label="Volume" style={{ "--p": (muted ? 0 : shown) + "%", "--b": (muted ? 0 : shown) + "%" }} />
        <button type="button" className={"vc-btn" + (menu ? " on" : "")} aria-label="Pengaturan" onClick={() => setMenu((m) => !m)}>{Ic.gear}</button>
        {canPip && <button type="button" className="vc-btn vc-pip" aria-label="Picture in Picture" title="Picture in Picture" onClick={pip}>{Ic.pip}</button>}
        <button type="button" className="vc-btn" aria-label={fs ? "Keluar layar penuh" : "Layar penuh"} onClick={fullscreen}>{fs ? Ic.fsx : Ic.fs}</button>
      </div>
    </div>
  );
}

export function Watch({ id }) {
  const S = useStore();
  const ep = S.data.episodes.find((e) => e.id === id);
  const a = ep && S.data.anime.find((x) => x.id === ep.animeId);
  const [idx, setIdx] = useState(0);
  const locked = !!a && isMovie(a) && !S.hasAccess(a);
  useEffect(() => { setIdx(0); }, [id]);
  useEffect(() => { if (S.user && ep && !locked) api("POST", "/api/history", { episodeId: ep.id }).catch(() => {}); }, [id, S.user && S.user.id, locked]); // eslint-disable-line
  if (!ep || !a) return <NotFound />;
  const orderedEpisodes = S.episodesOf(a).slice().sort((x, y) => x.number - y.number);
  const next = orderedEpisodes.find((e) => e.number > ep.number), prev = [...orderedEpisodes].reverse().find((e) => e.number < ep.number), srcs = locked ? [] : epSources(ep);
  const cur = srcs[Math.min(idx, srcs.length - 1)];
  return (
    <main className="wrap section">
      <p className="muted"><Link href={`/anime/${a.slug}`}>← {a.title}</Link></p>
      <h1 style={{ fontFamily: "'Space Grotesk'" }}>{a.title} — Episode {ep.number}</h1>
      <p className="muted watch-updated">Terakhir diperbarui / diunggah: {ep.createdAt ? new Date(ep.createdAt).toLocaleString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Tanggal tidak tersedia"}</p>
      <section className="cinema-section">
        <div className="cinema-heading">
          <div className="cinema-brand"><span className="cinema-mark">▶</span><div><strong>SHIAQTANIME <span>PLAYER</span></strong><small>IMMERSIVE WATCH EXPERIENCE</small></div></div>
          <div className="cinema-live"><i /> NOW PLAYING</div>
        </div>
        <div className={"player watch-player cinema-player" + (cur && detectSource(cur.url).type === "iframe" ? " cinema-embed" : "")} id="player">
        {locked ? (
          <div><div style={{ fontSize: 48 }}>🔒</div><p>Movie berbayar — <b style={{ color: "var(--gold)" }}>{rupiah(moviePrice(a))}</b> per movie.<br />{S.user ? "Beli movie ini untuk mulai menonton." : "Masuk ke akun Anda terlebih dahulu untuk membeli."}</p><button className="btn primary" onClick={() => openBuy(S, a.id)}>🎟 Beli — {rupiah(moviePrice(a))}</button></div>
        ) : cur ? <Player key={cur.url} source={cur} /> : (
          <div><div style={{ fontSize: 48, color: "var(--gold)" }}>▷</div><p>Episode ini belum memiliki sumber video.<br />Admin dapat menambahkan link sumber video resmi/berlisensi di dashboard.</p></div>
        )}
        {!locked && cur && detectSource(cur.url).type !== "iframe" && <div className="video-watermark" aria-hidden="true"><img src={WATERMARK_LOGO} alt="" /></div>}
        </div>
        <div className="cinema-footer"><span><b>{a.title}</b><small>Episode {ep.number}{ep.title ? " · " + ep.title : ""}</small></span><span className="cinema-secure">✦ SHIAQTANIME</span></div>
      </section>
      {srcs.length > 1 && <div className="filters" id="srcTabs" style={{ marginTop: 14 }}>{srcs.map((s, i) => <button key={i} type="button" className={"filter" + (i === idx ? " active" : "")} onClick={() => setIdx(i)}>{s.label}</button>)}</div>}
      <div className="watch-nav actions">{prev && <Link className="btn" href={`/watch/${prev.id}`}>← Episode Sebelumnya</Link>}<Link className="btn" href={`/anime/${a.slug}`}>Rincian Anime</Link>{next && <Link className="btn primary" href={`/watch/${next.id}`}>Episode Selanjutnya →</Link>}</div>
      <section className="watch-episodes panel"><h2>Daftar Episode</h2><div className="episode-list">{orderedEpisodes.map((item) => <Link key={item.id} className={"episode" + (item.id === ep.id ? " watch-current" : "")} href={`/watch/${item.id}`}><span><strong>Episode {item.number}</strong></span><span>{item.id === ep.id ? "Sedang diputar" : "▶ Putar"}</span></Link>)}</div></section>
    </main>
  );
}
