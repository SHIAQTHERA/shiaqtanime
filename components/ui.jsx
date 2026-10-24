"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "./store";
import { POSTER_COLORS, POSTER_SYMBOLS, cssUrl, isMovie, moviePrice, rupiah } from "@/lib/client";
import { aniById, aniTitle, aniStart, wdayOf, FMT } from "@/lib/anilist";

export const posterBg = (url) => (url ? { backgroundImage: `linear-gradient(#080a1430,#080a1455),url("${cssUrl(url)}")` } : {});

export function NotFound() {
  return <div className="nf"><div><h1>404</h1><h2>This page could not be found.</h2></div></div>;
}

/* Grid kartu anime katalog internal */
export function AnimeGrid({ list }) {
  const S = useStore();
  if (!list.length) return <div className="empty panel">Belum ada anime. Tambahkan judul melalui dashboard admin.</div>;
  return (
    <div className="grid">
      {list.map((a, i) => {
        const gs = S.genresOf(a).slice(0, 2).map((g) => g.name).join(" · ") || "Belum ada genre";
        const stop = (e, fn) => { e.preventDefault(); e.stopPropagation(); fn(); };
        return (
          <Link key={a.id} href={`/anime/${a.slug}`} className="anime-card">
            <div className="poster" style={{ ...posterBg(a.posterUrl), backgroundSize: "cover", backgroundPosition: "center", "--c1": POSTER_COLORS[i % 5], "--c2": "#141827" }}>
              {!a.posterUrl && <span className="symbol">{POSTER_SYMBOLS[i % 5]}</span>}
              <span className="year">{a.releaseYear ?? "Anime"}</span>
              <span className="label">{a.title}</span>
              {isMovie(a) && <span className="pbadge">🎬 {rupiah(moviePrice(a))}</span>}
              {S.isAdmin && (
                <span className="adm">
                  <button type="button" onClick={(e) => stop(e, () => S.openModal({ kind: "anime", id: a.id }))}>✎ Edit</button>
                  <button type="button" onClick={(e) => stop(e, () => S.deleteAnime(a.id))}>🗑</button>
                </span>
              )}
            </div>
            <h3>{a.title}</h3>
            <div className="meta"><span>{gs}</span><span className="rating">★ {a.rating ? a.rating : "—"}</span></div>
            <div className="meta" style={{ marginTop: 6 }}><span>{isMovie(a) ? "Movie · " + rupiah(moviePrice(a)) : S.epCount(a) + " episode"}</span><span>Detail ↗</span></div>
          </Link>
        );
      })}
    </div>
  );
}

export function RowSection({ title, sub, list, link }) {
  if (!list.length) return null;
  return (
    <section className="section wrap">
      <div className="sectionhead"><div><h2>{title}</h2><p>{sub}</p></div><Link className="count" href={link}>LIHAT SEMUA →</Link></div>
      <AnimeGrid list={list} />
    </section>
  );
}

/* Kartu anime dari AniList */
export function AniCards({ list }) {
  const S = useStore();
  return (
    <div className="grid">
      {list.map((m, i) => {
        aniById.set(m.id, m);
        const img = m.coverImage && (m.coverImage.extraLarge || m.coverImage.large);
        const gs = (m.genres || []).slice(0, 2).join(" · ") || "—";
        const info = m.status === "NOT_YET_RELEASED" || !m.nextAiringEpisode ? "Mulai " + aniStart(m) : "Eps. " + m.nextAiringEpisode.episode + " · " + wdayOf(m.nextAiringEpisode.airingAt);
        const open = () => S.openModal({ kind: "ani", id: m.id });
        return (
          <div key={m.id} className="anime-card" role="button" tabIndex={0} onClick={open} onKeyDown={(e) => { if (e.key === "Enter") open(); }}>
            <div className="poster" style={{ ...posterBg(img), backgroundSize: "cover", backgroundPosition: "center", "--c1": POSTER_COLORS[i % 5], "--c2": "#141827" }}>
              {!img && <span className="symbol">{POSTER_SYMBOLS[i % 5]}</span>}
              <span className="year">{FMT[m.format] || "Anime"}{m.seasonYear ? " · " + m.seasonYear : ""}</span>
              <span className="label">{aniTitle(m)}</span>
            </div>
            <h3>{aniTitle(m)}</h3>
            <div className="meta"><span>{gs}</span><span className="rating">★ {m.averageScore ? (m.averageScore / 10).toFixed(1) : "—"}</span></div>
            <div className="meta" style={{ marginTop: 6 }}><span>{info}</span><span>Detail ↗</span></div>
          </div>
        );
      })}
    </div>
  );
}

/* Memuat daftar dari AniList dengan status memuat / error / kosong */
export function AniList({ loader, empty, deps = [] }) {
  const [state, setState] = useState({ phase: "loading" });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState({ phase: "loading" });
    loader().then((list) => { if (alive) setState({ phase: "ok", list }); })
      .catch((e) => { if (alive) setState({ phase: "err", msg: e.message }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);
  if (state.phase === "loading") return <div className="empty panel">Memuat data dari AniList...</div>;
  if (state.phase === "err") return <div className="empty panel"><span className="notice-error">{state.msg}</span><br /><br /><button className="btn" onClick={() => setTick((t) => t + 1)}>Coba lagi</button></div>;
  return state.list.length ? <AniCards list={state.list} /> : <div className="empty panel">{empty}</div>;
}
