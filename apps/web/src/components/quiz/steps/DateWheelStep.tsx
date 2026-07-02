"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDob, validateDob } from "@/lib/quiz-validation";

/**
 * Custom 3-wheel date picker (docs/05 step 1): scroll-snap columns with large
 * touch targets, keyboard operable (each wheel is a listbox), no libraries.
 */

const ITEM_H = 44;
const VISIBLE = 5;
const WHEEL_H = ITEM_H * VISIBLE;
const PAD = (WHEEL_H - ITEM_H) / 2;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function WheelColumn({
  label,
  items,
  index,
  onChange,
}: {
  label: string;
  items: string[];
  index: number;
  onChange: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const suppress = useRef(false);

  // Position the wheel on mount and when index changes externally.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = index * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 1) {
      suppress.current = true;
      el.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
      window.setTimeout(() => (suppress.current = false), 50);
    }
  }, [index]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      if (suppress.current) return;
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => {
        const next = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)));
        if (next !== index) onChange(next);
      }, 90);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length, index, onChange]);

  function onKeyDown(e: React.KeyboardEvent) {
    const delta = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = Math.min(items.length - 1, Math.max(0, index + delta));
    onChange(next);
    ref.current?.scrollTo({ top: next * ITEM_H, behavior: "smooth" });
  }

  const activeId = `${label}-opt-${index}`;

  return (
    <div className="relative flex-1">
      <div
        ref={ref}
        role="listbox"
        tabIndex={0}
        aria-label={label}
        aria-activedescendant={activeId}
        onKeyDown={onKeyDown}
        className="no-scrollbar snap-y snap-mandatory overflow-y-scroll overscroll-contain rounded-card focus-visible:outline-2"
        style={{ height: WHEEL_H, paddingTop: PAD, paddingBottom: PAD }}
      >
        {items.map((item, i) => (
          <div
            key={item}
            id={`${label}-opt-${i}`}
            role="option"
            aria-selected={i === index}
            className={`flex snap-center items-center justify-center text-lg transition-colors duration-150 ${
              i === index ? "font-display text-xl text-gold-400" : "text-paper-300/70"
            }`}
            style={{ height: ITEM_H }}
            onClick={() => {
              onChange(i);
              ref.current?.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
            }}
          >
            {item}
          </div>
        ))}
      </div>
      {/* center band + fade masks */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 border-y border-ink-700"
        style={{ top: PAD, height: ITEM_H }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-ink-950 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-950 to-transparent"
      />
    </div>
  );
}

export function DateWheelStep({
  value,
  rules,
  onAdvance,
}: {
  value: string | undefined;
  rules: { min_year?: number; max_year?: number };
  onAdvance: (dob: string) => void;
}) {
  const minYear = rules.min_year ?? 1920;
  const maxYear = rules.max_year ?? 2015;
  const years = useMemo(() => {
    const list: string[] = [];
    for (let y = maxYear; y >= minYear; y--) list.push(String(y));
    return list;
  }, [minYear, maxYear]);
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1)), []);

  const initial = useMemo(() => {
    const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
    if (match) {
      return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    }
    return { year: 1992, month: 6, day: 15 };
  }, [value]);

  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parts = { year, month, day };
    const problem = validateDob(parts, rules);
    setError(problem);
    if (!problem) onAdvance(formatDob(parts));
  }

  return (
    <div>
      <div className="flex gap-2">
        <WheelColumn label="Day" items={days} index={day - 1} onChange={(i) => setDay(i + 1)} />
        <WheelColumn
          label="Month"
          items={MONTHS}
          index={month - 1}
          onChange={(i) => setMonth(i + 1)}
        />
        <WheelColumn
          label="Year"
          items={years}
          index={years.indexOf(String(year))}
          onChange={(i) => setYear(Number(years[i]))}
        />
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-center text-sm text-gold-200">
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
