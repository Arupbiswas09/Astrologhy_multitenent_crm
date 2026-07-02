"use client";

import { useEffect, useState } from "react";
import { getConsent, onConsentChange } from "@/lib/consent";

/**
 * Meta Pixel, loaded ONLY after consent-accept (docs/08 §3). Browser events
 * carry an event_id so the server CAPI event dedupes against them.
 */

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

function loadPixel(pixelId: string) {
  if (window.fbq) return;
  const fbq: Fbq = (...args: unknown[]) => {
    (fbq.queue = fbq.queue ?? []).push(args);
  };
  window.fbq = fbq;
  window._fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", pixelId);
  fbq("track", "PageView");
}

export function firePixelEvent(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === "undefined" || !window.fbq) return; // no consent → no-op
  window.fbq("track", event, params ?? {}, eventId ? { eventID: eventId } : undefined);
}

/** Fires a pixel event once fbq is available (waits out the consent race). */
export function PixelEvent({ event, eventId }: { event: string; eventId?: string }) {
  useEffect(() => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts++;
      if (window.fbq) {
        firePixelEvent(event, undefined, eventId);
        window.clearInterval(timer);
      } else if (attempts > 10) {
        window.clearInterval(timer); // no consent given — drop silently
      }
    }, 300);
    return () => window.clearInterval(timer);
  }, [event, eventId]);
  return null;
}

export function MetaPixel({ pixelId, pageEvent }: { pixelId: string; pageEvent?: string }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (getConsent() === "accepted") setConsented(true);
    return onConsentChange((choice) => setConsented(choice === "accepted"));
  }, []);

  useEffect(() => {
    if (!consented) return;
    loadPixel(pixelId);
    if (pageEvent) firePixelEvent(pageEvent);
  }, [consented, pixelId, pageEvent]);

  return null;
}
