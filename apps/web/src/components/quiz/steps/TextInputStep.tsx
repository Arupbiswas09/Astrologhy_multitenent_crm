"use client";

import { useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { letterValue } from "@astro-note/numerology";
import { validateFullName } from "@/lib/quiz-validation";

/**
 * Full-birth-name input with the `letters-to-numbers` signature moment
 * (docs/05 step 2): as they type, tiny gold numbers float up from the
 * letters — a preview of the letter values behind the reading.
 */

interface Floater {
  id: number;
  value: number;
  xPercent: number;
}

export function TextInputStep({
  value,
  placeholder,
  rules,
  onAdvance,
}: {
  value: string | undefined;
  placeholder: string;
  rules: { min_words?: number; max_length?: number };
  onAdvance: (name: string) => void;
}) {
  const reduced = useReducedMotion();
  const [name, setName] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const idCounter = useRef(0);
  const prevLetterCount = useRef((value ?? "").replace(/[^a-zA-Z]/g, "").length);

  function handleChange(next: string) {
    setName(next);
    if (error) setError(null);
    if (reduced) return;

    const letters = next.replace(/[^a-zA-Z]/g, "");
    if (letters.length > prevLetterCount.current && letters.length > 0) {
      const lastLetter = letters[letters.length - 1] as string;
      const id = ++idCounter.current;
      const xPercent = 12 + ((letters.length * 13) % 72); // deterministic spread
      setFloaters((f) => [...f.slice(-5), { id, value: letterValue(lastLetter), xPercent }]);
      window.setTimeout(() => {
        setFloaters((f) => f.filter((fl) => fl.id !== id));
      }, 900);
    }
    prevLetterCount.current = letters.length;
  }

  function submit() {
    const problem = validateFullName(name, rules);
    setError(problem);
    if (!problem) onAdvance(name.trim());
  }

  return (
    <div>
      <div className="relative">
        {/* floating letter values */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 h-10">
          <AnimatePresence>
            {floaters.map((f) => (
              <m.span
                key={f.id}
                initial={{ opacity: 0, y: 18, scale: 0.8 }}
                animate={{ opacity: 1, y: -6, scale: 1 }}
                exit={{ opacity: 0, y: -22 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="absolute font-display text-lg text-gold-400"
                style={{ left: `${f.xPercent}%` }}
              >
                {f.value}
              </m.span>
            ))}
          </AnimatePresence>
        </div>

        <input
          type="text"
          autoFocus
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="go"
          value={name}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          aria-label="Your full birth name"
          aria-invalid={Boolean(error)}
          className="w-full rounded-card border border-ink-700 bg-ink-900 px-5 py-4 text-center font-display text-2xl text-paper-100 placeholder:text-paper-300/40"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-center text-sm text-gold-200">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        className="mt-6 block w-full rounded-card bg-gold-400 px-6 py-4 text-center text-lg font-medium text-ink-950 transition-transform duration-150 hover:bg-gold-200 active:scale-[0.98]"
      >
        Continue
      </button>
    </div>
  );
}
