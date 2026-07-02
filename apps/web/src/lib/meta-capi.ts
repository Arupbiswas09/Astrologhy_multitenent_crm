import "server-only";
import { createHash } from "node:crypto";

/**
 * Meta Conversions API (docs/08 §3): server-side Lead event with an event_id
 * shared with the browser pixel for deduplication. Sent only when the lead
 * gave explicit marketing consent; fire-and-forget (never blocks the funnel).
 */

const CAPI_VERSION = "v21.0";
const TIMEOUT_MS = 3000;

export interface CapiLeadEvent {
  pixelId: string;
  email: string;
  eventId: string;
  sourceUrl: string;
  clientIp?: string;
  userAgent?: string;
}

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function sendCapiLead(event: CapiLeadEvent): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return; // not configured — browser pixel only

  const body = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: "website",
        event_source_url: event.sourceUrl,
        user_data: {
          em: [sha256(event.email)],
          ...(event.clientIp ? { client_ip_address: event.clientIp } : {}),
          ...(event.userAgent ? { client_user_agent: event.userAgent } : {}),
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${CAPI_VERSION}/${event.pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      console.warn("[meta-capi] non-2xx:", res.status, (await res.text()).slice(0, 200));
    }
  } catch (err) {
    console.warn("[meta-capi] failed:", err instanceof Error ? err.message : err);
  }
}
