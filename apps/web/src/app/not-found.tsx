import Link from "next/link";
import { InkGlyph } from "@/components/ink/InkGlyph";

/**
 * Covers both unknown paths and unknown-host rewrites from middleware
 * (docs/02 §3 "Unknown host → 404 tenant-not-found page").
 */
export default function NotFound() {
  return (
    <main className="ink-glow flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="flex items-center gap-2 text-gold-400" aria-hidden>
        <InkGlyph value={4} size={64} />
        <InkGlyph value={0} size={64} />
        <InkGlyph value={4} size={64} />
      </div>
      <h1 className="mt-6 font-display text-3xl">This page isn&apos;t written in the stars.</h1>
      <p className="mt-3 max-w-sm text-paper-300">
        The address doesn&apos;t match any site we serve. Check the link — or begin a fresh
        reading.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-card bg-gold-400 px-8 py-3 font-medium text-ink-950 transition-transform duration-150 hover:bg-gold-200 active:scale-[0.98]"
      >
        Go to the beginning
      </Link>
    </main>
  );
}
