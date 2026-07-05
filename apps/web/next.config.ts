import path from "node:path";
import type { NextConfig } from "next";

/**
 * CSP (docs/09 Phase 6): allow only ourselves + Plausible, beehiiv/SparkLoop
 * (co-reg embeds), and Meta pixel/CAPI endpoints. `unsafe-inline` for scripts
 * is required by Next's inline bootstrapping + the pixel loader on static
 * ISR pages (a nonce would force full-dynamic rendering).
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://plausible.io https://connect.facebook.net https://embeds.beehiiv.com https://*.beehiiv.com https://js.sparkloop.app https://*.sparkloop.app",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://plausible.io https://*.beehiiv.com https://*.sparkloop.app https://www.facebook.com https://connect.facebook.net",
  "frame-src https://*.beehiiv.com https://embeds.beehiiv.com https://*.sparkloop.app",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // Self-hosted in Docker behind Caddy + Cloudflare CDN (no Vercel).
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
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
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
