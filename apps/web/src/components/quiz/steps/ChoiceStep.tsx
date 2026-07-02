"use client";

import { useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import type { QuizChoiceOption } from "@astro-note/cms-sdk";
import { CardInkBorder } from "@/components/quiz/CardInkBorder";

const ADVANCE_DELAY_MS = 250; // docs/05: auto-advance 250ms after selection

export function ChoiceStep({
  choices,
  value,
  optional,
  skipLabel,
  onAdvance,
}: {
  choices: QuizChoiceOption[];
  value: string | undefined;
  optional: boolean;
  skipLabel: string;
  onAdvance: (value: string | null) => void;
}) {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<string | null>(value ?? null);
  const [locked, setLocked] = useState(false);

  function choose(next: string) {
    if (locked) return;
    setLocked(true);
    setSelected(next);
    window.setTimeout(() => onAdvance(next), reduced ? 80 : ADVANCE_DELAY_MS);
  }

  return (
    <div role="radiogroup" aria-label="Choose one" className="flex flex-col gap-3">
      {choices.map((choice) => {
        const isSelected = selected === choice.value;
        return (
          <m.button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => choose(choice.value)}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            transition={{ duration: 0.06 }}
            className="relative flex min-h-14 w-full items-center gap-3 rounded-card border border-ink-700 bg-ink-900 px-5 py-4 text-left text-[1.05rem] text-paper-100 transition-colors hover:border-paper-300/40"
          >
            <CardInkBorder selected={isSelected} />
            {choice.emoji ? (
              <span aria-hidden className="text-xl">
                {choice.emoji}
              </span>
            ) : null}
            <span>{choice.label}</span>
          </m.button>
        );
      })}

      {optional ? (
        <button
          type="button"
          onClick={() => !locked && onAdvance(null)}
          className="mt-2 self-center px-4 py-2 text-sm text-paper-300 underline-offset-4 hover:underline"
        >
          {skipLabel}
        </button>
      ) : null}
    </div>
  );
}
