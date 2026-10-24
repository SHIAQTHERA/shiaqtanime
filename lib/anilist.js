/* Integrasi AniList: jadwal tayang, musim, segera tayang (dipanggil dari browser) */
import { sleep, hk, fmtDate, pad2, MONTHS_ID } from "./client";

const ANI_URL = "https://graphql.anilist.co", ANI_TTL = 30 * 60 * 1000;
const aniMem = new Map();
export const aniById = new Map();

export async function anilist(query, variables) {
  const key = "shiaqani_" + hk(query + JSON.stringify(variables || {}));
  const hit = aniMem.get(key); if (hit && Date.now() - hit.t < ANI_TTL) return hit.d;
  try { const raw = sessionStorage.getItem(key); if (raw) { const o = JSON.parse(raw); if (Date.now() - o.t < ANI_TTL) { aniMem.set(key, o); return o.d; } } } catch (e) {}
  let res = null;
  for (let i = 0; i < 2; i++) {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 15000);
    try { res = await fetch(ANI_URL, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables }), signal: ctl.signal }); }
    catch (e) { clearTimeout(to); if (i === 1) throw new Error("Tidak dapat terhubung ke AniList. Periksa koneksi internet Anda."); await sleep(800); continue; }
    clearTimeout(to);
    if (res.status === 429) { await sleep(((+res.headers.get("Retry-After")) || 2) * 1000); continue; }
    break;
  }
  if (!res || !res.ok) throw new Error("AniList sedang bermasalah (kode " + (res ? res.status : "?") + "). Coba lagi nanti.");
  const j = await res.json(); if (j.errors) throw new Error(j.errors[0].message || "Terjadi kesalahan di AniList.");
  const o = { t: Date.now(), d: j.data }; aniMem.set(key, o); try { sessionStorage.setItem(key, JSON.stringify(o)); } catch (e) {}
  return j.data;
}

const ANI_F = "id title{romaji english native} coverImage{large extraLarge} bannerImage description(asHtml:false) averageScore format status episodes season seasonYear startDate{year month day} nextAiringEpisode{airingAt episode} genres studios(isMain:true){nodes{name}}";
const Q_SEASON = `query($s:MediaSeason,$y:Int,$p:Int){Page(page:$p,perPage:24){pageInfo{hasNextPage} media(season:$s,seasonYear:$y,type:ANIME,isAdult:false,sort:POPULARITY_DESC){${ANI_F}}}}`;
const Q_MONTH = `query($a:FuzzyDateInt,$b:FuzzyDateInt){Page(page:1,perPage:30){media(type:ANIME,isAdult:false,startDate_greater:$a,startDate_lesser:$b,sort:POPULARITY_DESC){${ANI_F}}}}`;
const Q_SCHED = `query($from:Int,$to:Int,$p:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage} airingSchedules(airingAt_greater:$from,airingAt_lesser:$to,sort:TIME){airingAt episode media{id title{romaji english} coverImage{large} format countryOfOrigin isAdult averageScore popularity}}}}`;

export const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];
export const curSeason = () => { const d = new Date(); return { s: SEASONS[Math.floor(d.getMonth() / 3)], y: d.getFullYear() }; };
export const shiftSeason = (c, n) => { const i = SEASONS.indexOf(c.s) + n; return { s: SEASONS[((i % 4) + 4) % 4], y: c.y + Math.floor(i / 4) }; };
export const seasonLabel = (c) => c.s[0] + c.s.slice(1).toLowerCase() + " " + c.y;
export const FMT = { TV: "TV", TV_SHORT: "TV Short", MOVIE: "Movie", SPECIAL: "Spesial", OVA: "OVA", ONA: "ONA", MUSIC: "Musik" };
export const aniTitle = (m) => (m.title && (m.title.english || m.title.romaji)) || "Tanpa judul";

export function aniStart(m) {
  const d = m.startDate || {}; if (d.year && d.month && d.day) return fmtDate(`${d.year}-${pad2(d.month)}-${pad2(d.day)}`);
  if (d.year && d.month) return MONTHS_ID[d.month - 1] + " " + d.year; return d.year ? String(d.year) : "Belum diumumkan";
}
export const aniClean = (s) => String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\(Source:[^)]*\)/gi, "").replace(/\n{3,}/g, "\n\n").trim();

const WDAYS = { Monday: "Senin", Tuesday: "Selasa", Wednesday: "Rabu", Thursday: "Kamis", Friday: "Jumat", Saturday: "Sabtu", Sunday: "Minggu" };
export const wdayOf = (sec) => WDAYS[new Date(sec * 1000).toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Jakarta" })];
export const timeOf = (sec) => new Date(sec * 1000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).replace(":", ".");

export async function seasonList(s, y) {
  let out = [];
  for (let p = 1; p <= 2; p++) { const r = (await anilist(Q_SEASON, { s, y, p })).Page; out = out.concat(r.media); if (!r.pageInfo.hasNextPage) break; await sleep(350); }
  return out;
}
const startKey = (m) => { const d = m.startDate || {}; return (d.year || m.seasonYear || 9999) * 10000 + (d.month || 13) * 100 + (d.day || 32); };
/* Segera tayang = anime musim ini & musim depan yang belum rilis */
export async function upcomingList() {
  const cs = curSeason(), nx = shiftSeason(cs, 1), seen = new Set();
  const a = await seasonList(cs.s, cs.y), b = await seasonList(nx.s, nx.y);
  return [...a, ...b].filter((m) => m.status === "NOT_YET_RELEASED" && !seen.has(m.id) && seen.add(m.id)).sort((x, y) => startKey(x) - startKey(y));
}
export async function monthList() {
  const d = new Date(), a = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100;
  const list = (await anilist(Q_MONTH, { a, b: a + 32 })).Page.media;
  return list.sort((x, y) => (x.startDate.day || 0) - (y.startDate.day || 0));
}
export async function aniSchedule() {
  const from = Math.floor(Date.now() / 3600000) * 3600, to = from + 7 * 86400; let out = [];
  for (let p = 1; p <= 3; p++) { const r = (await anilist(Q_SCHED, { from, to, p })).Page; out = out.concat(r.airingSchedules); if (!r.pageInfo.hasNextPage) break; await sleep(350); }
  return out.filter((x) => x.media && !x.media.isAdult && x.media.countryOfOrigin === "JP");
}

/* Terjemahan sinopsis ke bahasa Indonesia (MyMemory), di-cache di localStorage */
const SYN_CACHE = "shiaqtanime_synopsis_id_v1";
export async function translateSynopsisToId(raw) {
  const source = String(raw || "").trim();
  if (!source || source === "Sinopsis belum tersedia.") return source;
  if (/\b(yang|dan|dengan|adalah|untuk|dari|seorang|ketika|mereka|dalam)\b/i.test(source) && !/\b(the|and|with|when|their|they|this|that|from|after|before|story|world|young|must|will)\b/i.test(source)) return source;
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(SYN_CACHE) || "{}"); } catch (_) {}
  if (cache[source]) return cache[source];
  const chunks = []; let rest = source;
  while (rest.length > 450) { let cut = rest.lastIndexOf(" ", 450); if (cut < 180) cut = 450; chunks.push(rest.slice(0, cut)); rest = rest.slice(cut).trim(); }
  if (rest) chunks.push(rest);
  try {
    const translated = [];
    for (const chunk of chunks) {
      const response = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(chunk) + "&langpair=en|id", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Layanan terjemahan tidak tersedia");
      const data = await response.json(), value = data && data.responseData && data.responseData.translatedText;
      if (!value || data.responseStatus >= 400) throw new Error("Terjemahan tidak tersedia");
      translated.push(value.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
    }
    const result = translated.join(" ").trim();
    if (result) { cache[source] = result; try { localStorage.setItem(SYN_CACHE, JSON.stringify(cache)); } catch (_) {} return result; }
  } catch (err) { console.warn("Terjemahan sinopsis gagal:", err); }
  return source;
}

/* Susun payload POST /api/anime dari data AniList */
export function aniToPayload(m) {
  const title = aniTitle(m), movie = m.format === "MOVIE", sd = m.startDate || {};
  const status = m.status === "RELEASING" ? "ONGOING" : m.status === "NOT_YET_RELEASED" ? "UPCOMING" : "COMPLETED";
  return {
    anilistId: m.id, title, alternative: m.title.native || (m.title.romaji !== title ? m.title.romaji : null),
    synopsis: aniClean(m.description) || "Sinopsis belum tersedia.",
    posterUrl: (m.coverImage && (m.coverImage.extraLarge || m.coverImage.large)) || null, bannerUrl: m.bannerImage || null,
    releaseYear: m.seasonYear || sd.year || null, status, type: movie ? "MOVIE" : "TV",
    airDay: status === "ONGOING" && m.nextAiringEpisode ? wdayOf(m.nextAiringEpisode.airingAt) : null,
    airDate: status === "UPCOMING" && sd.year && sd.month && sd.day ? `${sd.year}-${pad2(sd.month)}-${pad2(sd.day)}` : null,
    rating: m.averageScore ? (m.averageScore / 10).toFixed(1) : null, featured: false, genreNames: m.genres || []
  };
}
