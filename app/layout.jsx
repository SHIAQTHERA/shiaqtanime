import "./globals.css";
import { FAVICON } from "@/lib/assets";

export const metadata = {
  title: "SHIAQTANIME — Anime Universe",
  description: "Jelajahi katalog anime SHIAQTANIME dengan sinopsis berbahasa Indonesia.",
  icons: { icon: [{ url: FAVICON, type: "image/png" }] }
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
