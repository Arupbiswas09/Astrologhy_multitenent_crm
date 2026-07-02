"use client";

import { m } from "framer-motion";

/**
 * `card-ink-select` (docs/07 §5): a gold border that draws itself around a
 * selected choice card in ~300ms, like ink circling an answer.
 */
export function CardInkBorder({ selected }: { selected: boolean }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <m.rect
        x="1"
        y="2"
        width="98"
        height="96"
        rx="7"
        fill="none"
        stroke="var(--gold-400)"
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
        initial={false}
        animate={selected ? { pathLength: 1, opacity: 1 } : { pathLength: 0.001, opacity: 0 }}
        transition={{ pathLength: { duration: 0.3, ease: "easeOut" }, opacity: { duration: 0.1 } }}
      />
    </svg>
  );
}
