"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Fires report_viewed once per page view (docs/08 §3). */
export function ReportAnalytics({ tenantSlug }: { tenantSlug: string }) {
  useEffect(() => {
    track("report_viewed", { tenant: tenantSlug });
  }, [tenantSlug]);
  return null;
}

/** Share row: native share sheet with clipboard fallback (docs/06 §1.13). */
export function ShareRow({ landingUrl }: { landingUrl: string }) {
  async function share() {
    const url = `${landingUrl}?ref=share`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Find your number",
          text: "I just got my numerology reading — find your number too:",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      window.alert("Link copied — send it to a friend.");
    } catch {
      /* user dismissed the share sheet */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="mx-auto block rounded-card border border-ink-700 px-6 py-3 text-paper-300 transition-colors hover:border-gold-400 hover:text-paper-100"
    >
      ✦ Send a friend their number
    </button>
  );
}

/** Offer CTA with click tracking (opens in new tab, rel=sponsored). */
export function OfferCta({
  href,
  label,
  tenantSlug,
}: {
  href: string;
  label: string;
  tenantSlug: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener"
      onClick={() => track("offer_click", { tenant: tenantSlug })}
      className="mt-4 block w-full rounded-card bg-gold-400 px-6 py-3.5 text-center font-medium text-ink-950 transition-transform duration-150 hover:bg-gold-200 active:scale-[0.98]"
    >
      {label}
    </a>
  );
}
