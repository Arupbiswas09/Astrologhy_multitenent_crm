import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@astro-note/numerology",
    "@astro-note/report-composer",
    "@astro-note/cms-sdk",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Directus asset URLs (tenant logos, offer images)
      { protocol: "https", hostname: "**" },
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;
