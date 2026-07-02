import type { TenantTheme } from "@astro-note/cms-sdk";

/**
 * Tenant theme JSON → CSS custom-property overrides (docs/02 §3, docs/07 §2).
 * CMS values are untrusted: only known token keys with safe values pass.
 */

const COLOR_TOKENS = [
  "ink-950",
  "ink-900",
  "ink-700",
  "paper-100",
  "paper-300",
  "gold-400",
  "gold-200",
  "violet-500",
] as const;

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const SAFE_RADIUS = /^\d{1,3}(?:\.\d+)?(?:px|rem|em)$/;

export function themeToCssVars(theme: TenantTheme | null | undefined): string {
  const vars: string[] = [];
  for (const key of COLOR_TOKENS) {
    const value = theme?.colors?.[key];
    if (typeof value === "string" && HEX_COLOR.test(value)) {
      vars.push(`--${key}: ${value};`);
    }
  }
  if (typeof theme?.radius === "string" && SAFE_RADIUS.test(theme.radius)) {
    vars.push(`--radius: ${theme.radius};`);
  }
  return vars.length ? `:root{${vars.join("")}}` : "";
}

/** Logo paths may be local (/brand/…) or absolute Directus asset URLs. */
export function safeLogoSrc(src: string | undefined | null): string | null {
  if (!src) return null;
  if (src.startsWith("/brand/")) return src;
  try {
    const url = new URL(src);
    return url.protocol === "https:" || url.protocol === "http:" ? src : null;
  } catch {
    return null;
  }
}
