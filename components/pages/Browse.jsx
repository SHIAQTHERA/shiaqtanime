"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "../store";
import { AnimeGrid, AniList } from "../ui";
import { DAYS, FAQ, MON, MONTHS_ID, fmtDate, isMovie, untilLabel } from "@/lib/client";
import { FMT, SEASONS, aniSchedule, aniTitle, curSeason, monthList, seasonLabel, seasonList, shiftSeason, timeOf, upcomingList, wdayOf } from "@/lib/anilist";

/* ===== Katalog ===== */
export function Catalog({ params }) {
  const S = useStore();
  const q = (params.get("q") || "").trim(), genre = params.get("genre") || "", status = params.get("status") || "", huruf = params.get("huruf") || "";
  const ql = q.toLowerCase();
  const list = S.data.anime.filter((a) =>
    (!q || a.title.toLowerCase().includes(ql) || (a.alternative || "").toLowerCase().includes(ql)) &&
    (!genre || S.genresOf(a).some((g) => g.slug === genre)) && (!status || a.status === status) &&
    (!huruf || (huruf === "#" ? !/^[a-z]/i.test(a.title) : a.title.toUpperCase().startsWith(huruf)))
  ).sort((a, b) => (huruf ? a.title.localeCompare(b.title) : b.updatedAt - a.updatedAt));
  const genres = [...S.data.genres].sort((a, b) => a.name.localeCompare(b.name));
  const st = { background: "#0b0e18", border: "1px solid var(--line)", borderRadius: 9, padding: 11, color: "white" };
  const submit = (e) => {
    e.preventDefault(); const p = new URLSearchParams();
    new FormData(e.target).forEach((v, k) => { if (String(v).trim()) p.set(k, String(v).trim()); });
    S.router.push("/anime" + (p.toString() ? "?" + p : ""));
  };
  return (
    <main className="wrap section">
      <div className="sectionhead"><div><h2>Katalog Anime</h2><p>Cari berdasarkan judul, genre, atau status.</p></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{S.isAdmin && <button className="btn primary" onClick={() => S.openModal({ kind: "anime" })}>＋ Tambah Anime</button>}<span className="count">{list.length} JUDUL</span></div></div>
      <form className="panel" id="catForm" key={params.toString()} onSubmit={submit} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <input name="q" defaultValue={q} placeholder="Nama anime..." style={{ flex: "1 1 200px", ...st }} />
        <select name="genre" defaultValue={genre} style={st}><option value="">Semua genre</option>{genres.map((g) => <option key={g.id} value={g.slug}>{g.name}</option>)}</select>
        <select name="status" defaultValue={status} style={st}><option value="">Semua status</option><option value="ONGOING">Ongoing</option><option value="COMPLETED">Completed</option><option value="UPCOMING">Upcoming</option></select>
        <button className="btn primary">Terapkan</button><Link className="btn" href="/anime">Reset</Link>
      </form>
      <div className="filters">{genres.map((g) => <Link key={g.id} className={"filter" + (genre === g.slug ? " active" : "")} href={`/anime?genre=${encodeURIComponent(g.slug)}`}>{g.name}</Link>)}</div>
      <div className="filters" style={{ gap: 5 }}>{["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((h) => <Link key={h} className={"filter" + (huruf === h ? " active" : "")} style={{ padding: "6px 9px" }} href={`/anime?huruf=${encodeURIComponent(h)}`}>{h}</Link>)}</div>
      <AnimeGrid list={list} />
    </main>
  );
}

/* ===== Sedang Tayang / Selesai Tayang / Movie ===== */
export function ByKind({ kind }) {
  const S = useStore();
  const cfg = {
    sedang: ["Sedang Tayang", "Anime yang sedang tayang saat ini.", (a) => !isMovie(a) && a.status === "ONGOING"],
    selesai: ["Selesai Tayang", "Anime yang sudah tamat tayang.", (a) => !isMovie(a) && a.status === "COMPLETED"],
    film: ["Movie Anime Layar Lebar", "Movie anime layar lebar. Tonton per movie dengan harga terjangkau.", (a) => isMovie(a)]
  }[kind];
  const list = S.data.anime.filter(cfg[2]).sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <main className="wrap section">
      <div className="sectionhead"><div><h2>{cfg[0]}</h2><p>{cfg[1]}</p></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {S.isAdmin && <button className="btn primary" onClick={() => S.openModal({ kind: "anime", preset: kind === "film" ? "MOVIE" : undefined })}>＋ Tambah {kind === "film" ? "Movie" : "Anime"}</button>}
          <span className="count">{list.length} JUDUL</span></div></div>
      {kind === "film" && <div className="panel" style={{ marginBottom: 18 }}><h2 style={{ marginTop: 0, fontSize: 16 }}>🎟 Rp5.000 per movie</h2><p className="muted" style={{ fontSize: 13, lineHeight: 1.8, margin: 0 }}>Pilih movie, tekan <b>Beli & Tonton</b>, bayar sesuai petunjuk, lalu admin akan mengonfirmasi pembayaran Anda. Setelah itu movie bisa ditonton berulang kali dari akun Anda.</p></div>}
      <AnimeGrid list={list} />
    </main>
  );
}

/* ===== Jadwal Rilis ===== */
function AniSchedule({ day }) {
  const [st, setSt] = useState({ phase: "loading" }), [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true; setSt({ phase: "loading" });
    aniSchedule().then((all) => { if (alive) setSt({ phase: "ok", list: all.filter((x) => wdayOf(x.airingAt) === day).sort((a, b) => a.airingAt - b.airingAt) }); })
      .catch((e) => { if (alive) setSt({ phase: "err", msg: e.message }); });
    return () => { alive = false; };
  }, [day, tick]);
  return (
    <>
      <div className="sectionhead" style={{ marginTop: 34 }}><div><h2>Jadwal Global (AniList)</h2><p>Jam tayang dalam WIB untuk 7 hari ke depan.</p></div><span className="count" id="aniSchedCount">{st.phase === "ok" ? st.list.length + " EPISODE" : ""}</span></div>
      <div className="sched" id="aniSched">
        {st.phase === "loading" && <div className="empty panel">Memuat data dari AniList...</div>}
        {st.phase === "err" && <div className="empty panel"><span className="notice-error">{st.msg}</span><br /><br /><button className="btn" onClick={() => setTick((t) => t + 1)}>Coba lagi</button></div>}
        {st.phase === "ok" && (st.list.length ? st.list.map((x) => {
          const m = x.media, t = new Date(x.airingAt * 1000);
          return (
            <a key={x.airingAt + "-" + m.id} className="sched-item" href={`https://anilist.co/anime/${m.id}`} target="_blank" rel="noopener noreferrer">
              <div className="sched-date"><b style={{ fontSize: 16 }}>{timeOf(x.airingAt)}</b><small>WIB</small></div>
              <div className="sched-info"><h3>{aniTitle(m)}</h3><div className="meta"><span>Episode {x.episode}</span><span>{FMT[m.format] || "Anime"}</span><span className="rating">★ {m.averageScore ? (m.averageScore / 10).toFixed(1) : "—"}</span></div></div>
              <span className="sched-tag">{t.toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }).toUpperCase()}</span>
            </a>
          );
        }) : <div className="empty panel">Tidak ada jadwal tayang pada hari {day} (7 hari ke depan).</div>)}
      </div>
      <p className="ani-credit">Data jadwal oleh <a href="https://anilist.co" target="_blank" rel="noopener noreferrer">AniList</a>.</p>
    </>
  );
}
export function Schedule({ params }) {
  const S = useStore();
  const todayIdx = (new Date().getDay() + 6) % 7, day = DAYS.includes(params.get("hari")) ? params.get("hari") : DAYS[todayIdx];
  const list = S.data.anime.filter((a) => a.status === "ONGOING" && a.airDay === day).sort((x, y) => x.title.localeCompare(y.title));
  return (
    <main className="wrap section">
      <div className="sectionhead"><div><h2>Jadwal Rilis</h2><p>Jadwal tayang mingguan anime yang sedang berjalan.</p></div><span className="count">{list.length} JUDUL</span></div>
      <div className="filters">{DAYS.map((d, i) => <Link key={d} className={"filter" + (d === day ? " active" : "")} href={`/jadwal?hari=${d}`}>{d}{i === todayIdx ? " •" : ""}</Link>)}</div>
      <div className="sched">
        {list.length ? list.map((a) => (
          <Link key={a.id} className="sched-item" href={`/anime/${a.slug}`}>
            <div className="sched-date"><b>{day.slice(0, 3).toUpperCase()}</b><small>{S.epCount(a)} EP</small></div>
            <div className="sched-info"><h3>{a.title}</h3><div className="meta"><span>{S.genresOf(a).slice(0, 3).map((g) => g.name).join(" · ") || "Belum ada genre"}</span><span className="rating">★ {a.rating ? a.rating : "—"}</span></div></div>
            <span className="sched-tag">SETIAP {day.toUpperCase()}</span>
            {S.isAdmin && <span className="adm"><button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); S.openModal({ kind: "anime", id: a.id }); }}>✎ Edit</button></span>}
          </Link>
        )) : <div className="empty panel">Belum ada anime yang dijadwalkan pada hari {day}.</div>}
      </div>
      <AniSchedule day={day} />
    </main>
  );
}

/* ===== Musim / Segera Tayang ===== */
function ScheduleUpcoming() {
  const S = useStore();
  const up = S.data.anime.filter((a) => a.status === "UPCOMING").sort((a, b) => (a.airDate || "9999").localeCompare(b.airDate || "9999") || a.title.localeCompare(b.title));
  return (
    <section style={{ paddingBottom: 10 }}>
      <div className="sectionhead"><div><h2>Segera Tayang</h2><p>Jadwal anime yang akan segera hadir.</p></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{S.isAdmin && <button className="btn primary" onClick={() => S.openModal({ kind: "anime", preset: "UPCOMING" })}>＋ Tambah Jadwal</button>}<Link className="count" href="/musim?tab=segera">LIHAT SEMUA →</Link><span className="count">{up.length} JUDUL</span></div></div>
      <div className="sched">
        {up.length ? up.map((a) => {
          const d = a.airDate ? new Date(a.airDate + "T00:00:00") : null, ok = d && !isNaN(d);
          return (
            <Link key={a.id} className="sched-item" href={`/anime/${a.slug}`}>
              <div className="sched-date">{ok ? <><b>{d.getDate()}</b><small>{MON[d.getMonth()]}</small></> : <><b>?</b><small>TBA</small></>}</div>
              <div className="sched-info"><h3>{a.title}</h3><div className="meta"><span>{S.genresOf(a).slice(0, 3).map((g) => g.name).join(" · ") || "Belum ada genre"}</span>{ok && <span>{fmtDate(a.airDate)}</span>}</div></div>
              <span className="sched-tag">{ok ? untilLabel(a.airDate) : "SEGERA TAYANG"}</span>
              {S.isAdmin && <span className="adm"><button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); S.openModal({ kind: "anime", id: a.id }); }}>✎ Edit</button><button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); S.deleteAnime(a.id); }}>🗑</button></span>}
            </Link>
          );
        }) : <div className="empty panel">Belum ada jadwal anime yang akan tayang.</div>}
      </div>
    </section>
  );
}
export function Season({ params }) {
  const tab = ["season", "bulan", "segera"].includes(params.get("tab")) ? params.get("tab") : "season", cs = curSeason();
  const s = SEASONS.includes(params.get("s")) ? params.get("s") : cs.s, y = Number(params.get("y")) || cs.y;
  const prev = shiftSeason(cs, -1), next = shiftSeason(cs, 1), cur = { s, y }, now = new Date();
  const same = (a, b) => a.s === b.s && a.y === b.y;
  const tabs = [
    ["Musim Lalu · " + seasonLabel(prev), `/musim?s=${prev.s}&y=${prev.y}`, tab === "season" && same(cur, prev)],
    ["Musim Ini · " + seasonLabel(cs), "/musim", tab === "season" && same(cur, cs)],
    ["Musim Depan · " + seasonLabel(next), `/musim?s=${next.s}&y=${next.y}`, tab === "season" && same(cur, next)],
    ["Tayang Bulan Ini", "/musim?tab=bulan", tab === "bulan"], ["Segera Tayang", "/musim?tab=segera", tab === "segera"]
  ];
  const head = tab === "bulan" ? [`Tayang Bulan Ini — ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`, "Anime yang mulai tayang bulan ini."]
    : tab === "segera" ? ["Segera Tayang", "Anime yang belum rilis, diurutkan menurut popularitas."]
    : [`Anime Musim ${seasonLabel(cur)}`, "Daftar anime yang tayang pada musim ini."];
  const loader = tab === "bulan" ? monthList : tab === "segera" ? upcomingList : () => seasonList(s, y);
  const empty = tab === "bulan" ? "Belum ada anime yang dijadwalkan tayang bulan ini." : tab === "segera" ? "Belum ada data anime yang akan datang." : "Belum ada data untuk musim ini.";
  return (
    <main className="wrap section">
      <div className="sectionhead"><div><h2>{head[0]}</h2><p>{head[1]}</p></div></div>
      <div className="filters">{tabs.map(([l, h, on]) => <Link key={l} className={"filter" + (on ? " active" : "")} href={h}>{l}</Link>)}</div>
      {tab === "segera" && <ScheduleUpcoming />}
      <div id="aniBox"><AniList loader={loader} empty={empty} deps={[tab, s, y]} /></div>
      <p className="ani-credit">Data jadwal & musim oleh <a href="https://anilist.co" target="_blank" rel="noopener noreferrer">AniList</a>. Ini hanya informasi; video tidak disediakan oleh AniList.</p>
    </main>
  );
}

/* ===== FAQ ===== */
export function Faq() {
  return (
    <main className="wrap section">
      <div className="sectionhead"><div><h2>FAQ</h2><p>Pertanyaan yang sering diajukan.</p></div></div>
      <div style={{ display: "grid", gap: 10, maxWidth: 820 }}>
        {FAQ.map(([q, a], i) => <details key={q} className="panel faq" open={i === 0 ? true : undefined}><summary>{q}</summary><p>{a}</p></details>)}
      </div>
    </main>
  );
}
