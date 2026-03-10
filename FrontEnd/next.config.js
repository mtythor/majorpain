const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID || "dev",
    NEXT_PUBLIC_BUILD_TIMESTAMP:
      process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ||
      new Date().toISOString(),
    NEXT_PUBLIC_ONESIGNAL_APP_ID:
      process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "",
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    domains: [],
  },
  // Enable compression for production
  compress: true,
  // Generate ETags for caching
  generateEtags: true,
  // Power the app with the React compiler (Next.js 14+)
  reactStrictMode: true,
  // Prevent caching of PWA assets so icon/manifest updates are picked up promptly
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/workbox-:path",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
