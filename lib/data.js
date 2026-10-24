import { query } from "./db.js";

const n = (v) => (v == null ? null : Number(v));

export const mapAnime = (r, genreIds = []) => ({
  id: r.id, slug: r.slug, anilistId: r.anilist_id, title: r.title, alternative: r.alternative,
  synopsis: r.synopsis, posterUrl: r.poster_url, bannerUrl: r.banner_url, releaseYear: r.release_year,
  status: r.status, airDay: r.air_day, airDate: r.air_date, type: r.type, price: r.price,
  rating: r.rating, featured: r.featured, createdAt: n(r.created_at), updatedAt: n(r.updated_at), genreIds
});
export const mapEpisode = (r) => ({
  id: r.id, animeId: r.anime_id, number: r.number, title: r.title, synopsis: r.synopsis,
  sources: r.sources || [], createdAt: n(r.created_at)
});

export async function getSettings() {
  const { rows } = await query("SELECT key, value FROM settings");
  const s = { payment: { method: "", qrisUrl: "", instructions: "", whatsapp: "" }, saweria: "", extLink: { label: "", url: "" }, socialLinks: { tiktok: "", facebook: "", instagram: "" }, maintenance: { enabled: false, message: "Kami sedang melakukan pemeliharaan untuk meningkatkan pengalaman menonton." } };
  for (const r of rows) s[r.key] = r.value;
  return s;
}

export async function loadBootstrap(user) {
  const [animeQ, genresQ, linkQ, epQ, settings] = await Promise.all([
    query("SELECT * FROM anime"),
    query("SELECT id, name, slug FROM genres"),
    query("SELECT anime_id, genre_id FROM anime_genres"),
    query("SELECT * FROM episodes ORDER BY anime_id, number"),
    getSettings()
  ]);
  const gmap = new Map();
  for (const l of linkQ.rows) { if (!gmap.has(l.anime_id)) gmap.set(l.anime_id, []); gmap.get(l.anime_id).push(l.genre_id); }
  const anime = animeQ.rows.map((r) => mapAnime(r, gmap.get(r.id) || []));
  const isAdmin = !!user && user.role === "ADMIN";

  let orders = [], watchlist = [];
  if (user) {
    const w = await query("SELECT user_id, anime_id, created_at FROM watchlist WHERE user_id = $1", [user.id]);
    watchlist = w.rows.map((r) => ({ userId: r.user_id, animeId: r.anime_id, createdAt: n(r.created_at) }));
    const o = isAdmin
      ? await query("SELECT o.*, u.name AS user_name, u.email AS user_email FROM orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC")
      : await query("SELECT o.*, u.name AS user_name, u.email AS user_email FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.user_id = $1 ORDER BY o.created_at DESC", [user.id]);
    orders = o.rows.map((r) => ({
      id: r.id, userId: r.user_id, animeId: r.anime_id, amount: r.amount, status: r.status, ref: r.ref,
      createdAt: n(r.created_at), updatedAt: n(r.updated_at), userName: r.user_name, userEmail: r.user_email
    }));
  }

  // Sumber video movie berbayar hanya dikirim ke admin atau pembeli yang sudah lunas
  const paid = new Set(orders.filter((o) => o.status === "PAID" && (!user || o.userId === user.id)).map((o) => o.animeId));
  const movieIds = new Set(anime.filter((a) => a.type === "MOVIE").map((a) => a.id));
  const episodes = epQ.rows.map((r) => {
    const ep = mapEpisode(r);
    if (movieIds.has(ep.animeId) && !isAdmin && !paid.has(ep.animeId)) return { ...ep, sources: [], locked: true };
    return ep;
  });

  const publicSettings = { payment: settings.payment, saweria: settings.saweria, extLink: settings.extLink, socialLinks: settings.socialLinks, maintenance: settings.maintenance || { enabled: false, message: "Kami sedang melakukan pemeliharaan untuk meningkatkan pengalaman menonton." } };
  return {
    user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null,
    anime, genres: genresQ.rows, episodes, watchlist, orders, settings: publicSettings
  };
}
