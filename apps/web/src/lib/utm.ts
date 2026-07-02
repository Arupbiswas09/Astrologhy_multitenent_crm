"use client";

/**
 * UTM + fbclid capture: first touch wins, mirrored to sessionStorage, sent
 * with the lead (docs/08 §3). No PII, no cookies.
 */

const KEY = "an_utm";
const FIELDS = ["source", "medium", "campaign", "content", "term"] as const;

export type UtmData = Partial<Record<(typeof FIELDS)[number] | "fbclid", string>>;

export function captureUtmOnce(): void {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const utm: UtmData = {};
    for (const field of FIELDS) {
      const value = params.get(`utm_${field}`);
      if (value) utm[field] = value.slice(0, 200);
    }
    const fbclid = params.get("fbclid");
    if (fbclid) utm.fbclid = fbclid.slice(0, 200);
    if (Object.keys(utm).length > 0) sessionStorage.setItem(KEY, JSON.stringify(utm));
  } catch {
    /* storage unavailable (private mode) — UTM attribution is best-effort */
  }
}

export function readUtm(): UtmData {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UtmData) : {};
  } catch {
    return {};
  }
}
