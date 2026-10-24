"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { AnimeGrid, AniList, RowSection, posterBg } from "../ui";
import { POSTER_COLORS, POSTER_SYMBOLS, cssUrl, isMovie, num } from "@/lib/client";
import { curSeason, seasonLabel, seasonList, upcomingList } from "@/lib/anilist";

function HeroSlider() {
  const S = useStore();
  const rank = (x, y) => num(y.rating) - num(x.rating) || y.updatedAt - x.updatedAt;
  const f = S.data.anime.filter((a) => a.featured).sort(rank), rest = S.data.anime.filter((a) => !a.featured).sort(rank);
  const list = [...f, ...rest].slice(0, 6), n = list.length;
  const [i, setI] = useState(0), hover = useRef(false), sx = useRef(null);
  const go = (k) => setI(((k % n) + n) % n);
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => { if (!hover.current) setI((x) => (x + 1) % n); }, 5000);
    return () => clearInterval(t);
  }, [n]);
  useEffect(() => { if (i >= n) setI(0); }, [n, i]);

  if (!n) return (
    <section className="hero wrap"><div className="hero-inner"><div className="eyebrow">✦ Anime populer</div><h1>Belum ada<br /><span>anime populer.</span></h1><p>Admin dapat menambahkan anime langsung dari portal ini.</p></div></section>
  );
  return (
    <section className="hero wrap">
      <div className="slider" id="slider" onMouseEnter={() => { hover.current = true; }} onMouseLeave={() => { hover.current = false; }}
        onTouchStart={(e) => { sx.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (sx.current === null) return; const dx = e.changedTouches[0].clientX - sx.current; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); sx.current = null; }}>
        <div className="slides" id="slides" style={{ transform: `translateX(-${i * 100}%)` }}>
          {list.map((a, k) => {
            const img = a.bannerUrl || a.posterUrl;
            const bg = img ? { backgroundImage: `url("${cssUrl(img)}")` } : { background: `linear-gradient(105deg,#171b2b,${POSTER_COLORS[k % 5]}55 70%,#1b2a40)` };
            const pbg = a.posterUrl ? { backgroundImage: `url("${cssUrl(a.posterUrl)}")`, backgroundSize: "cover", backgroundPosition: "center" } : {};
            const first = S.episodesOf(a)[0];
            return (
              <div className="slide" style={bg} key={a.id}>
                <div className="slide-body">
                  <div className="eyebrow">✦ Populer #{k + 1}</div>
                  <h2 className="slide-title">{a.title}</h2>
                  <div>{S.genresOf(a).map((g) => <span key={g.id} className="tag">{g.name}</span>)}</div>
                  <p>{a.synopsis}</p>
                  <div className="slide-meta"><span className="rating">★ {a.rating ? a.rating : "—"}</span><span>{a.releaseYear ?? "—"}</span><span>{a.status}</span><span>{S.epCount(a)} episode</span></div>
                  <div className="actions">
                    {first && <Link className="btn primary" href={`/watch/${first.id}`}>▶ Tonton Sekarang</Link>}
                    <Link className={"btn" + (first ? "" : " primary")} href={`/anime/${a.slug}`}>Detail ↗</Link>
                    {S.isAdmin && <><button className="btn" onClick={() => S.openModal({ kind: "anime", id: a.id })}>✎ Edit</button><button className="btn" onClick={() => S.deleteAnime(a.id)}>🗑 Hapus</button></>}
                  </div>
                </div>
                <Link className="slide-art" href={`/anime/${a.slug}`} tabIndex={-1}>
                  <div className="poster" style={{ ...pbg, "--c1": POSTER_COLORS[k % 5], "--c2": "#141827" }}>
                    {!a.posterUrl && <span className="symbol">{POSTER_SYMBOLS[k % 5]}</span>}
                    <span className="year">{a.releaseYear ?? "Anime"}</span><span className="label">{a.title}</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
        {n > 1 && (
          <>
            <button className="sl-btn sl-prev" aria-label="Sebelumnya" onClick={() => go(i - 1)}>‹</button>
            <button className="sl-btn sl-next" aria-label="Berikutnya" onClick={() => go(i + 1)}>›</button>
            <div className="sl-dots">{list.map((_, k) => <button key={k} className={k === i ? "on" : ""} aria-label={`Slide ${k + 1}`} onClick={() => go(k)} />)}</div>
          </>
        )}
      </div>
    </section>
  );
}

function LatestEpisodes() {
  const S = useStore();
  // Satu kartu per anime: episode bernomor tertinggi (jika sama, yang paling baru ditambahkan)
  const latest = new Map();
  for (const e of S.data.episodes) {
    const a = S.data.anime.find((x) => x.id === e.animeId); if (!a) continue;
    const cur = latest.get(e.animeId), no = Number(e.number) || 0, curNo = cur ? Number(cur.e.number) || 0 : -1;
    const t = Number(e.createdAt) || 0, curT = cur ? Number(cur.e.createdAt) || 0 : -1;
    if (!cur || no > curNo || (no === curNo && t > curT)) latest.set(e.animeId, { e, a });
  }
  const rows = [...latest.values()].sort((x, y) => {
    const tx = Number(x.e.createdAt) || Number(x.a.updatedAt) || Number(x.a.createdAt) || 0;
    const ty = Number(y.e.createdAt) || Number(y.a.updatedAt) || Number(y.a.createdAt) || 0;
    return ty - tx || (Number(y.e.number) || 0) - (Number(x.e.number) || 0);
  }).slice(0, 6);
  if (!rows.length) return null;
  return (
    <section className="section wrap">
      <div className="sectionhead"><div><h2>Episode Terbaru</h2><p>Episode terbaru dari setiap anime.</p></div><Link className="count" href="/jadwal">JADWAL RILIS →</Link></div>
      <div className="grid">
        {rows.map(({ e, a }, i) => (
          <Link key={e.id} href={`/watch/${e.id}`} className="anime-card">
            <div className="poster" style={{ ...posterBg(a.posterUrl), backgroundSize: "cover", backgroundPosition: "center", "--c1": POSTER_COLORS[i % 5], "--c2": "#141827" }}>
              {!a.posterUrl && <span className="symbol">{POSTER_SYMBOLS[i % 5]}</span>}
              <span className="year">EP {e.number}</span><span className="label">{a.title}</span>
            </div>
            <h3>{a.title}</h3><div className="meta"><span>Episode {e.number}</span><span className="rating">▶ Putar</span></div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Airing() {
  const S = useStore();
  const [tab, setTab] = useState("now"), [soonLoaded, setSoonLoaded] = useState(false);
  const ong = S.data.anime.filter((a) => !isMovie(a) && a.status === "ONGOING").sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const up = S.data.anime.filter((a) => a.status === "UPCOMING").sort((a, b) => (a.airDate || "9999").localeCompare(b.airDate || "9999"));
  const pick = (t) => { setTab(t); if (t === "soon") setSoonLoaded(true); };
  return (
    <section className="section wrap">
      <div className="sectionhead"><div><h2>Sedang Tayang & Segera Tayang</h2><p>Anime yang sedang tayang, dan yang segera hadir musim ini & musim depan.</p></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><Link className="count" href="/sedang-tayang">SEDANG TAYANG →</Link><Link className="count" href="/musim?tab=segera">SEGERA TAYANG →</Link></div></div>
      <div className="filters" id="airTabs">
        <button type="button" className={"filter" + (tab === "now" ? " active" : "")} onClick={() => pick("now")}>Sedang Tayang</button>
        <button type="button" className={"filter" + (tab === "soon" ? " active" : "")} onClick={() => pick("soon")}>Segera Tayang</button>
      </div>
      <div id="airNow" hidden={tab !== "now"}><AnimeGrid list={ong} /></div>
      <div id="airSoon" hidden={tab !== "soon"}>
        {S.isAdmin && <div style={{ marginBottom: 14 }}><button className="btn primary" onClick={() => S.openModal({ kind: "anime", preset: "UPCOMING" })}>＋ Tambah Jadwal</button></div>}
        <div id="airSoonDb">{up.length ? <><AnimeGrid list={up} /><div style={{ height: 18 }} /></> : null}</div>
        <div id="airSoonAni">{soonLoaded && <AniList loader={async () => (await upcomingList()).slice(0, 12)} empty="Belum ada anime musim ini/musim depan yang akan tayang." />}</div>
      </div>
    </section>
  );
}

function AniHome() {
  const c = curSeason();
  return (
    <section className="section wrap">
      <div className="sectionhead"><div><h2>Musim {seasonLabel(c)}</h2><p>Anime musim ini, data dari AniList.</p></div><Link className="count" href="/musim">LIHAT SEMUA →</Link></div>
      <div id="aniHome"><AniList loader={async () => (await seasonList(c.s, c.y)).slice(0, 5)} empty="Belum ada data musim ini." /></div>
    </section>
  );
}

export default function Home() {
  const S = useStore();
  const featured = S.data.anime.filter((a) => a.featured).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const latest = [...S.data.anime].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  return (
    <main>
      <HeroSlider />
      <LatestEpisodes />
      <Airing />
      <AniHome />
      <section className="section wrap">
        <div className="sectionhead"><div><h2>Anime Pilihan</h2><p>Judul yang disorot oleh admin.</p></div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{S.isAdmin && <button className="btn primary" onClick={() => S.openModal({ kind: "anime" })}>＋ Tambah Anime</button>}<Link className="count" href="/anime">LIHAT SEMUA →</Link></div></div>
        <AnimeGrid list={featured} />
      </section>
      <RowSection title="Movie Anime Layar Lebar" sub="Movie anime layar lebar — Rp5.000 per movie." list={S.data.anime.filter(isMovie).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)} link="/film" />
      <section className="section wrap">
        <div className="sectionhead"><div><h2>Baru Ditambahkan</h2><p>Temukan judul terbaru di katalog.</p></div><span className="count">{latest.length} JUDUL</span></div>
        <AnimeGrid list={latest} />
      </section>
      <section className="section wrap"><div className="panel"><h2 style={{ marginTop: 0 }}>Catatan penayangan</h2><p className="muted" style={{ fontSize: 13, lineHeight: 1.8 }}>Template ini tidak menyediakan video anime tanpa izin. Admin dapat memasukkan metadata dan URL video dari sumber resmi/berlisensi yang memang memiliki hak untuk ditayangkan.</p></div></section>
    </main>
  );
}
