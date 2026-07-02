import { ImageResponse } from "next/og";
import { getTenant } from "@/lib/cms";

/** Per-tenant OG image (docs/09 Phase 6) — ink, gold number, headline. */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Your numbers have been waiting for you.";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenant(slug).catch(() => null);
  const name = tenant?.name ?? "Astro Note";
  const gold = tenant?.theme?.colors?.["gold-400"] ?? "#E4B85C";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0B0E1C",
          backgroundImage: "radial-gradient(ellipse 60% 50% at 50% 35%, rgba(228,184,92,0.12), transparent)",
          color: "#F5EFE2",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <span style={{ fontSize: 200, color: gold, lineHeight: 1 }}>7</span>
          <span style={{ fontSize: 64, color: gold, opacity: 0.65 }}>· 3 · 11</span>
        </div>
        <div style={{ fontSize: 52, marginTop: 24, textAlign: "center", maxWidth: 900 }}>
          Your numbers have been waiting for you.
        </div>
        <div style={{ fontSize: 28, marginTop: 20, color: "#CFC6B2" }}>
          {name} — a free personalized numerology reading
        </div>
      </div>
    ),
    size,
  );
}
