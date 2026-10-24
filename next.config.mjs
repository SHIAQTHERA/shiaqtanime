/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pg"],
  images: {
    formats: ["image/avif", "image/webp"],
    // Next.js 16 membatasi quality yang boleh diminta dari endpoint optimizer.
    // Sertakan kualitas yang dipakai helper gambar agar URL tidak mengembalikan HTTP 400.
    qualities: [60, 65, 70, 72, 75, 80, 85],
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "s1.anilist.co" },
      { protocol: "https", hostname: "s2.anilist.co" },
      { protocol: "https", hostname: "s3.anilist.co" },
      { protocol: "https", hostname: "img.anili.st" }
    ]
  }
};
export default nextConfig;
