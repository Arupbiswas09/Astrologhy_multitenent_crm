"use client";

import { m, useReducedMotion } from "framer-motion";
import type { NameLetter } from "@astro-note/numerology";
import { MotionProvider } from "@/components/motion";
import { InkGlyph } from "@/components/ink/InkGlyph";

/**
 * The calculation moment (docs/06 §1.4): the visitor's name letters flip
 * into their values (rotateX, 40ms stagger — `letters-to-numbers`), then the
 * sum resolves into the Expression number. Credibility through arithmetic.
 */
export function CalcMoment({
  letters,
  expression,
}: {
  letters: NameLetter[];
  expression: number;
}) {
  const reduced = useReducedMotion();
  const shown = letters.slice(0, 24); // very long names stay readable

  return (
    <MotionProvider>
      <div className="rounded-card border border-ink-700 bg-ink-900 p-5">
        <p className="mb-4 text-center font-annotation text-xl text-gold-400">
          How we weighed your name
        </p>

        <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-4" aria-hidden>
          {shown.map((letter, i) => (
            <div key={`${letter.letter}-${i}`} className="w-7 text-center" style={{ perspective: 300 }}>
              <div className={letter.isVowel ? "text-gold-200" : "text-paper-300"}>
                {letter.letter}
              </div>
              <m.div
                initial={reduced ? false : { rotateX: 90, opacity: 0 }}
                whileInView={{ rotateX: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ delay: reduced ? 0 : i * 0.04, duration: 0.35, ease: "easeOut" }}
                className="mt-1 border-t border-ink-700 pt-1 font-display text-lg text-gold-400"
              >
                {letter.value}
              </m.div>
            </div>
          ))}
        </div>

        <p className="sr-only">
          The letters of your name sum to your Expression number, {expression}.
        </p>

        <m.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: reduced ? 0 : shown.length * 0.04 + 0.3, duration: 0.5 }}
          className="mt-5 flex items-center justify-center gap-3"
          aria-hidden
        >
          <span className="text-paper-300">every letter, summed</span>
          <span className="font-display text-xl text-paper-100">→</span>
          <span className="text-gold-400">
            <InkGlyph value={expression} size={40} />
          </span>
        </m.div>
      </div>
    </MotionProvider>
  );
}
