"use client";

import { m, useReducedMotion } from "framer-motion";

/** Thin gold progress bar with a springy fill (docs/07 §5 `progress-fill`). */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  const reduced = useReducedMotion();
  const percent = Math.min(100, Math.round(((current + 1) / total) * 100));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`Step ${current + 1} of ${total}`}
      className="fixed inset-x-0 top-0 z-40 h-[3px] bg-ink-700/60"
    >
      <m.div
        className="h-full bg-gold-400"
        initial={false}
        animate={{ width: `${percent}%` }}
        transition={
          reduced
            ? { duration: 0.12 }
            : { type: "spring", stiffness: 210, damping: 20, mass: 0.6 }
        }
      />
    </div>
  );
}
