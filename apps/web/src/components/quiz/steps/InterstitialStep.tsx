"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";

/**
 * Step-8 "calculating" interstitial (docs/05): the user's DOB digits orbit,
 * then collapse inward — and we cut to email capture BEFORE any number is
 * revealed (the open loop). `orbit-collapse` in the animation registry.
 */

const RING_RADIUS = 105;
const TEXT_ROTATE_MS = 1150;

export function InterstitialStep({
  dob,
  durationMs,
  rotatingTexts,
  onDone,
}: {
  dob: string | undefined;
  durationMs: number;
  rotatingTexts: string[];
  onDone: () => void;
}) {
  const reduced = useReducedMotion();
  const [textIndex, setTextIndex] = useState(0);
  const [collapsing, setCollapsing] = useState(false);
  const doneRef = useRef(false);

  const digits = useMemo(() => {
    const numeric = (dob ?? "1990-01-01").replace(/\D/g, "").slice(0, 8);
    return numeric.split("");
  }, [dob]);

  useEffect(() => {
    const collapseAt = Math.max(600, durationMs - 900);
    const collapseTimer = window.setTimeout(() => setCollapsing(true), collapseAt);
    const doneTimer = window.setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone();
      }
    }, durationMs);
    const textTimer = window.setInterval(
      () => setTextIndex((i) => (i + 1) % Math.max(1, rotatingTexts.length)),
      TEXT_ROTATE_MS,
    );
    return () => {
      window.clearTimeout(collapseTimer);
      window.clearTimeout(doneTimer);
      window.clearInterval(textTimer);
    };
  }, [durationMs, onDone, rotatingTexts.length]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative mt-2 mb-10 h-[260px] w-[260px]" aria-hidden>
        {/* slow orbit of the whole ring (decorative) */}
        <m.div
          className="absolute inset-0 motion-decorative"
          animate={reduced ? undefined : { rotate: 360 }}
          transition={
            reduced ? undefined : { duration: 9, ease: "linear", repeat: Infinity }
          }
        >
          {digits.map((digit, i) => {
            const angle = (i / digits.length) * Math.PI * 2 - Math.PI / 2;
            const dx = Math.cos(angle) * RING_RADIUS;
            const dy = Math.sin(angle) * RING_RADIUS;
            return (
              <m.span
                key={`${digit}-${i}`}
                className="absolute top-1/2 left-1/2 font-display text-2xl text-gold-400"
                initial={{ x: dx - 8, y: dy - 16, opacity: 0 }}
                animate={
                  collapsing
                    ? { x: -8, y: -16, opacity: 0, scale: 0.2 }
                    : { x: dx - 8, y: dy - 16, opacity: 1, scale: 1 }
                }
                transition={
                  collapsing
                    ? { duration: 0.7, ease: [0.5, 0, 0.75, 0] }
                    : { duration: 0.5, delay: i * 0.08 }
                }
              >
                {digit}
              </m.span>
            );
          })}
        </m.div>

        {/* center point that "absorbs" the digits */}
        <m.div
          className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400"
          animate={
            collapsing
              ? { scale: [1, 2.4, 1.6], boxShadow: "0 0 42px 12px rgba(228,184,92,0.45)" }
              : { scale: [1, 1.25, 1], boxShadow: "0 0 18px 4px rgba(228,184,92,0.25)" }
          }
          transition={{ duration: collapsing ? 0.8 : 1.6, repeat: collapsing ? 0 : Infinity }}
        />
      </div>

      <div className="h-8" aria-live="polite">
        <AnimatePresence mode="wait">
          <m.p
            key={textIndex}
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -8 }}
            transition={{ duration: reduced ? 0.12 : 0.3 }}
            className="text-center text-paper-300"
          >
            {rotatingTexts[textIndex % Math.max(1, rotatingTexts.length)]}
          </m.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
