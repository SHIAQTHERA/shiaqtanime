/* Helper sisi klien (tanpa dependensi Node) */
export const DEFAULT_PRICE = 5000;
export const DAYS = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"];
export const MON = ["JAN","FEB","MAR","APR","MEI","JUN","JUL","AGU","SEP","OKT","NOV","DES"];
export const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
export const STL = { PENDING: "Menunggu konfirmasi", PAID: "Lunas", REJECTED: "Ditolak" };
export const POSTER_COLORS = ["#3b536e","#72506d","#6a573f","#3d6c70","#514b83"];
export const POSTER_SYMBOLS = ["✦","⚔","☄","❖","✧"];

// Gunakan optimizer Next.js untuk gambar remote (termasuk cover AniList).
// Output optimizer otomatis WebP/AVIF sesuai dukungan browser dan cache hasilnya.
export const optimizedImageUrl = (u, width = 640, quality = 75) => {
  if (!u) return "";
  const value = String(u);
  if (!/^https:\/\//i.test(value) || !/(^|\.)anilist\.co$|(^|\.)anili\.st$/i.test(new URL(value).hostname)) return value;
  return `/_next/image?url=${encodeURIComponent(value)}&w=${width}&q=${quality}`;
};
export const cssUrl = (u) => String(optimizedImageUrl(u, 1200, 70)).replace(/["\\\n\r]/g, (c) => "\\" + c.charCodeAt(0).toString(16) + " ");
export const rupiah = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
export const isMovie = (a) => !!a && a.type === "MOVIE";
export const moviePrice = (a) => (Number(a && a.price) > 0 ? Number(a.price) : DEFAULT_PRICE);
export const httpsOk = (u) => { try { return new URL(u).protocol === "https:"; } catch (e) { return false; } };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const hk = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
export const orderRef = (u, a) => "SHQ-" + hk(u.id + a.id).slice(0, 5).toUpperCase();
export const pad2 = (n) => String(n).padStart(2, "0");
export const num = (r) => parseFloat(r) || 0;

export function fmtDate(s) {
  const d = new Date(s + "T00:00:00");
  return isNaN(d) ? "" : d.getDate() + " " + MON[d.getMonth()].charAt(0) + MON[d.getMonth()].slice(1).toLowerCase() + " " + d.getFullYear();
}
export function untilLabel(s) {
  const d = new Date(s + "T00:00:00"); if (isNaN(d)) return "SEGERA";
  const t0 = new Date(); t0.setHours(0, 0, 0, 0); const n = Math.round((d - t0) / 864e5);
  return n > 1 ? `${n} HARI LAGI` : n === 1 ? "BESOK" : n === 0 ? "HARI INI" : "SUDAH TAYANG";
}

/* Sumber video: satu per baris "Nama server | URL" */
export const epSources = (e) => (Array.isArray(e.sources) ? e.sources : []);
export function parseSourcesText(text) {
  const out = [];
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    const i = line.indexOf("|"), label = (i > 0 ? line.slice(0, i) : "").trim() || "Server " + (out.length + 1), url = (i > 0 ? line.slice(i + 1) : line).trim();
    if (!httpsOk(url)) return { error: `URL harus diawali https:// → "${line.slice(0, 60)}"` };
    out.push({ label: label.slice(0, 30), url });
  }
  return { list: out };
}
export const srcToText = (e) => epSources(e).map((s) => s.label + " | " + s.url).join("\n");

export function detectSource(u) {
  let url; try { url = new URL(u); } catch (e) { return { type: "iframe", src: u }; }
  const h = url.hostname.replace(/^www\./, ""), path = url.pathname;
  let id = null;
  if (h === "youtu.be") id = path.slice(1);
  else if (h.endsWith("youtube.com") || h.endsWith("youtube-nocookie.com")) id = url.searchParams.get("v") || (path.match(/^\/(?:embed|shorts|live)\/([^/?]+)/) || [])[1];
  if (id) return { type: "iframe", src: "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) };
  if (h === "drive.google.com") { const m = path.match(/\/file\/d\/([^/]+)/), fid = m ? m[1] : url.searchParams.get("id"); if (fid) return { type: "iframe", src: "https://drive.google.com/file/d/" + encodeURIComponent(fid) + "/preview" }; }
  if (/\.m3u8$/i.test(path)) return { type: "hls", src: u };
  if (/\.(mp4|webm|ogv|ogg|m4v|mov)$/i.test(path)) return { type: "video", src: u };
  return { type: "iframe", src: u };
}

export const FAQ = [
  ["Apa itu SHIAQTANIME?", "SHIAQTANIME adalah katalog anime dengan jadwal rilis, daftar tontonan pribadi, dan informasi musim anime dari AniList."],
  ["Dari mana video anime berasal?", "Video hanya berasal dari sumber resmi/berlisensi yang dimasukkan admin. Jika sebuah episode belum punya sumber video, pemutar akan menampilkan pesan bahwa sumber belum tersedia."],
  ["Bagaimana cara menyimpan anime ke Daftar Saya?", "Daftar atau masuk ke akun, buka halaman detail anime, lalu tekan tombol \"Tambah ke Daftar Saya\". Daftar bisa dilihat lewat ikon masuk di pojok kanan atas."],
  ["Bagaimana cara menonton Movie Anime berbayar?", "Buka halaman movie, tekan \"Beli & Tonton\", bayar sesuai petunjuk, lalu tekan \"Saya Sudah Bayar\". Setelah admin mengonfirmasi, movie bisa ditonton berulang kali dari akun Anda. Harga standar Rp5.000 per movie."],
  ["Berapa lama konfirmasi pembayaran?", "Konfirmasi dilakukan manual oleh admin. Kirim bukti pembayaran lewat WhatsApp admin (jika tersedia di jendela pembayaran) agar lebih cepat diproses."],
  ["Dari mana data jadwal dan musim anime?", "Data jadwal global, anime musiman, dan segera tayang diambil dari AniList. Jam tayang ditampilkan dalam WIB dan bisa berubah sewaktu-waktu mengikuti pengumuman resmi."],
  ["Apakah data akun dan obrolan saya aman?", "Data akun, daftar tontonan, pesanan, dan Ruang Ngobrol disimpan di database server situs ini, sehingga tetap ada saat Anda berganti perangkat. Password disimpan dalam bentuk hash, bukan teks asli."],
  ["Kenapa sinopsis tampil dalam bahasa Indonesia?", "Sinopsis dari AniList diterjemahkan otomatis ke bahasa Indonesia, sehingga hasilnya bisa kurang sempurna."],
  ["Saya menemukan masalah atau ingin menghubungi admin, bagaimana?", "Gunakan Ruang Ngobrol (tombol 💬 di pojok kanan bawah) atau hubungi admin lewat kontak yang tersedia di jendela pembayaran."]
];
