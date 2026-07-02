"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { MotionProvider } from "@/components/motion";
import { InkNumber } from "@/components/ink/InkNumber";
import {
  DIGIT_H,
  DIGIT_PATHS,
  DIGIT_W,
  DOT_LINKS,
  constellationDots,
  ellipsePath,
} from "@/components/ink/digit-paths";

const CYCLE_MS = 3200;
const DRAW_S = 1.5;

/**
 * Landing hero centerpiece: the signature number cycling 1→9, each drawn in
 * gold ink inside a persistent hand-drawn ellipse with constellation dots
 * (docs/05 "Landing"). Reduced motion: a static 7, fully drawn, no cycling.
 */
export function LivingNumber({ size = 190 }: { size?: number }) {
  const reduced = useReducedMotion();
  const [digit, setDigit] = useState(1);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setDigit((d) => (d % 9) + 1), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  if (reduced) {
    return (
      <MotionProvider>
        <InkNumber value={7} size={size} animate="none" />
      </MotionProvider>
    );
  }

  const pad = 16;
  const viewBox = `${-pad} ${-pad} ${DIGIT_W + pad * 2} ${DIGIT_H + pad * 2}`;
  const dots = constellationDots(DIGIT_W);

  return (
    <MotionProvider>
      <div style={{ height: size }} className="motion-decorative relative">
        <svg
          viewBox={viewBox}
          style={{ height: size, width: (size * (DIGIT_W + pad * 2)) / (DIGIT_H + pad * 2) }}
          fill="none"
          overflow="visible"
          role="img"
          aria-label="Numbers 1 through 9 drawing themselves in gold ink"
        >
          {/* persistent frame: ellipse + dots draw once on mount */}
          <m.path
            d={ellipsePath(DIGIT_W)}
            stroke="var(--gold-400)"
            strokeOpacity={0.85}
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ pathLength: 0.001 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut", delay: DRAW_S * 0.7 }}
          />
          {DOT_LINKS.map(([a, b]) => {
            const from = dots[a];
            const to = dots[b];
            if (!from || !to) return null;
            return (
              <m.line
                key={`l-${a}-${b}`}
                x1={from[0]}
                y1={from[1]}
                x2={to[0]}
                y2={to[1]}
                stroke="var(--gold-200)"
                strokeOpacity={0.35}
                strokeWidth={1}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: DRAW_S + 0.8 }}
              />
            );
          })}
          {dots.map(([x, y], i) => (
            <m.circle
              key={`d-${i}`}
              cx={x}
              cy={y}
              r={2.4}
              fill="var(--gold-200)"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 0.9, scale: 1 }}
              transition={{ duration: 0.5, delay: DRAW_S + 0.5 + i * 0.07 }}
            />
          ))}

          {/* cycling digit */}
          <AnimatePresence mode="wait">
            <m.path
              key={digit}
              d={digitPath(digit)}
              stroke="var(--gold-400)"
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0.001, opacity: 1 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
              transition={{ pathLength: { duration: DRAW_S, ease: [0.22, 0.8, 0.36, 1] } }}
            />
          </AnimatePresence>
        </svg>
      </div>
    </MotionProvider>
  );
}

function digitPath(d: number): string {
  return DIGIT_PATHS[String(d)] ?? DIGIT_PATHS["7"] ?? "";
}
