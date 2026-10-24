"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { StoreProvider, useStore } from "./store";
import { Frame } from "./Shell";
import { NotFound } from "./ui";
import Home from "./pages/Home";
import { Catalog, ByKind, Schedule, Season, Faq } from "./pages/Browse";
import { Detail, Watch } from "./pages/Anime";
import { Login, Register, MyList } from "./pages/Account";
import { Admin, Manage } from "./pages/Admin";

function Logout() {
  const S = useStore();
  useEffect(() => { S.logout(); }, []); // eslint-disable-line
  return null;
}

function Routes() {
  const S = useStore();
  const pathname = usePathname(), params = useSearchParams();
  if (!S.ready) {
    return S.error
      ? <main className="wrap section"><div className="panel"><h1 style={{ fontFamily: "'Space Grotesk'" }}>Tidak dapat memuat data</h1><p className="notice-error" style={{ fontSize: 13 }}>{S.error}</p><p className="muted" style={{ fontSize: 13 }}>Pastikan database Supabase aktif dan variabel DATABASE_URL sudah benar.</p><button className="btn" onClick={() => S.refresh()}>Coba lagi</button></div></main>
      : null;
  }
  const seg = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (!seg.length) return <Home />;
  if (seg[0] === "anime" && seg.length === 1) return <Catalog params={params} />;
  if (seg[0] === "anime" && seg.length === 2) return <Detail slug={seg[1]} />;
  if (seg[0] === "watch" && seg.length === 2) return <Watch id={seg[1]} />;
  if (seg[0] === "jadwal") return <Schedule params={params} />;
  if (seg[0] === "sedang-tayang") return <ByKind kind="sedang" />;
  if (seg[0] === "selesai-tayang") return <ByKind kind="selesai" />;
  if (seg[0] === "film") return <ByKind kind="film" />;
  if (seg[0] === "musim") return <Season params={params} />;
  if (seg[0] === "faq") return <Faq />;
  if (seg[0] === "login") return <Login />;
  if (seg[0] === "register") return <Register />;
  if (seg[0] === "logout") return <Logout />;
  if (seg[0] === "my-list") return <MyList />;
  if (seg[0] === "admin" && seg.length === 1) return <Admin />;
  if (seg[0] === "admin" && seg[1] === "anime" && seg.length === 3) return <Manage id={seg[2]} />;
  return <NotFound />;
}

export default function App() {
  return (
    <StoreProvider>
      <Frame><Routes /></Frame>
    </StoreProvider>
  );
}
