"use client";

import { useEffect } from "react";

/** Root error boundary — friendly, on-brand, recoverable. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="ink-glow flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-annotation text-3xl text-gold-400">hm.</p>
      <h1 className="mt-4 font-display text-3xl">The ink smudged for a moment.</h1>
      <p className="mt-3 max-w-sm text-paper-300">
        Something went wrong on our side — your answers are safe on this device.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-card bg-gold-400 px-8 py-3 font-medium text-ink-950 transition-transform duration-150 hover:bg-gold-200 active:scale-[0.98]"
      >
        Try again
      </button>
    </main>
  );
}
