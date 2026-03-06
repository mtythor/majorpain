import { NextResponse } from "next/server";

/**
 * Dynamic manifest with cache-busting icon URLs.
 * Uses build ID so each deploy has unique icon URLs, preventing
 * stale cached icons after PWA reinstall.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || "dev";
  const v = buildId;

  const manifest = {
    name: "Major Pain Fantasy Golf",
    short_name: "Major Pain",
    description:
      "Major Pain Fantasy Golf - Draft and manage your fantasy golf team",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0f0f",
    theme_color: "#fdc71c",
    icons: [
      {
        src: `/icons/icon-192x192.png?v=${v}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icons/icon-512x512.png?v=${v}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };

  const response = NextResponse.json(manifest);
  response.headers.set("Content-Type", "application/manifest+json");
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
