"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isMovie } from "@/lib/client";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });
  let j = null;
  try { j = await res.json(); } catch (e) {}
  if (!res.ok) throw new Error((j && j.error) || "Terjadi kesalahan (kode " + res.status + ")");
  return j;
}

export function StoreProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [toastState, setToastState] = useState(null);
  const toastTimer = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const d = await api("GET", "/api/bootstrap");
      setData(d); setError(null); return d;
    } catch (e) { setError(e.message); return null; }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const toast = useCallback((msg, undo) => {
    clearTimeout(toastTimer.current);
    setToastState({ msg, undo, k: Date.now() });
    toastTimer.current = setTimeout(() => setToastState(null), undo ? 8000 : 3200);
  }, []);
  const clearToast = useCallback(() => { clearTimeout(toastTimer.current); setToastState(null); }, []);

  const openModal = useCallback((m) => setModal(m), []);
  const closeModal = useCallback(() => setModal(null), []);
  useEffect(() => { setModal(null); }, [pathname]);
  useEffect(() => { document.body.style.overflow = modal ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [modal]);

  const value = useMemo(() => {
    const d = data || { user: null, anime: [], genres: [], episodes: [], watchlist: [], orders: [], settings: { payment: {}, saweria: "", extLink: {}, maintenance: { enabled: false } } };
    const user = d.user, isAdmin = !!user && user.role === "ADMIN";
    const genresOf = (a) => a.genreIds.map((id) => d.genres.find((g) => g.id === id)).filter(Boolean);
    const episodesOf = (a) => d.episodes.filter((e) => e.animeId === a.id).sort((x, y) => x.number - y.number);
    const epCount = (a) => d.episodes.filter((e) => e.animeId === a.id).length;
    const orderOf = (u, a) => d.orders.filter((o) => o.userId === u.id && o.animeId === a.id).sort((x, y) => y.createdAt - x.createdAt)[0] || null;
    const hasAccess = (a) => {
      if (!isMovie(a)) return true; if (!user) return false; if (isAdmin) return true;
      return d.orders.some((o) => o.userId === user.id && o.animeId === a.id && o.status === "PAID");
    };
    const pendingOrders = d.orders.filter((o) => o.status === "PENDING").length;

    const deleteAnime = async (id) => {
      const a = d.anime.find((x) => x.id === id);
      if (!a || !confirm(`Hapus anime "${a.title}" beserta semua episodenya?`)) return;
      try { await api("DELETE", "/api/anime/" + id); } catch (e) { toast(e.message); return; }
      await refresh();
      if (/^\/anime\/[^/]+$/.test(pathname)) router.push("/");
    };
    const logout = async () => { try { await api("POST", "/api/auth/logout"); } catch (e) {} await refresh(); router.push("/"); };

    return { data: d, ready: !!data, error, refresh, user, isAdmin, genresOf, episodesOf, epCount, orderOf, hasAccess, pendingOrders,
      modal, openModal, closeModal, toast, clearToast, toastState, deleteAnime, logout, router, pathname };
  }, [data, error, modal, toastState, refresh, toast, clearToast, openModal, closeModal, router, pathname]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
