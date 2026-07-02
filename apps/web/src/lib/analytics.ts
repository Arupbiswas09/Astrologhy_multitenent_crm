"use client";

/**
 * Plausible event chain — docs/08 §3. Cookieless, no consent needed as
 * configured; the script is injected per-tenant in the tenant layout.
 */

export type FunnelEvent =
  | "quiz_start"
  | `quiz_step_${number}`
  | "email_submitted"
  | "report_viewed"
  | "coreg_impression"
  | "coreg_click"
  | "offer_click";

type PlausibleFn = (event: string, options?: { props?: Record<string, string | number> }) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn & { q?: unknown[] };
  }
}

export function track(event: FunnelEvent, props?: Record<string, string | number>): void {
  if (typeof window === "undefined") return;
  // Queue shim: events fired before the script loads are not lost.
  const w = window;
  if (!w.plausible) {
    const queued = ((...args: unknown[]) => {
      (queued.q = queued.q ?? []).push(args);
    }) as PlausibleFn & { q?: unknown[] };
    w.plausible = queued;
  }
  w.plausible(event, props ? { props } : undefined);
}
