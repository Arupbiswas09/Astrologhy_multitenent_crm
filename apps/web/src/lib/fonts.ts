import localFont from "next/font/local";

/**
 * Self-hosted per docs/07 §3 + docs/02 §5: preload the display font only;
 * body swaps with metric-adjusted fallbacks; Caveat is `optional` (decorative).
 */

export const fraunces = localFont({
  src: "../fonts/fraunces-latin-var.woff2",
  variable: "--font-fraunces",
  display: "swap",
  weight: "100 900",
  preload: true,
});

export const satoshi = localFont({
  src: [
    { path: "../fonts/satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/satoshi-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
  preload: false,
});

export const caveat = localFont({
  src: "../fonts/caveat-latin-var.woff2",
  variable: "--font-caveat",
  display: "optional",
  weight: "400 700",
  preload: false,
});

export const fontVariables = `${fraunces.variable} ${satoshi.variable} ${caveat.variable}`;
