/**
 * Astro Note numerology engine — Pythagorean system.
 * Spec: docs/04-NUMEROLOGY-ENGINE.md. Pure, deterministic, zero dependencies.
 *
 * The engine returns numbers + flags only. Meanings live in the CMS
 * (content_blocks) and are attached by @astro-note/report-composer.
 */

// ── §1 Letter values ─────────────────────────────────────────────────────────

const LETTER_TABLE: Record<number, string> = {
  1: "AJS",
  2: "BKT",
  3: "CLU",
  4: "DMV",
  5: "ENW",
  6: "FOX",
  7: "GPY",
  8: "HQZ",
  9: "IR",
};

const LETTER_VALUES: ReadonlyMap<string, number> = new Map(
  Object.entries(LETTER_TABLE).flatMap(([value, letters]) =>
    [...letters].map((letter) => [letter, Number(value)] as const),
  ),
);

/** A E I O U. Y is decided positionally — see {@link isVowelAt}. */
const PLAIN_VOWELS = new Set(["A", "E", "I", "O", "U"]);

export const MASTER_NUMBERS = [11, 22, 33] as const;
export const KARMIC_DEBT_NUMBERS = [13, 14, 16, 19] as const;

/** Pythagorean value of a single A–Z letter (case-insensitive). */
export function letterValue(letter: string): number {
  const value = LETTER_VALUES.get(letter.toUpperCase());
  if (value === undefined) {
    throw new RangeError(`letterValue: "${letter}" is not an A-Z letter`);
  }
  return value;
}

/**
 * Y rule (doc §1, pragmatic + deterministic): Y is a vowel when the letters
 * immediately before and after it — within its word — are both non-vowels
 * (not A E I O U) or a word boundary. Adjacent Y letters count as non-vowels.
 * Examples: LYNN → vowel · MARY → vowel (word end) · MAYA → consonant ·
 * YOLANDA → consonant (Y before O) · YVONNE → vowel.
 */
function classifyVowel(letter: string, before: string | undefined, after: string | undefined): boolean {
  if (PLAIN_VOWELS.has(letter)) return true;
  if (letter !== "Y") return false;
  const beforeIsVowel = before !== undefined && PLAIN_VOWELS.has(before);
  const afterIsVowel = after !== undefined && PLAIN_VOWELS.has(after);
  return !beforeIsVowel && !afterIsVowel;
}

export interface NameLetter {
  letter: string;
  value: number;
  isVowel: boolean;
}

export interface NameAnalysis {
  /** Every A–Z letter of the name, in order, with value and vowel classification. */
  letters: NameLetter[];
  total: number;
  vowelTotal: number;
  consonantTotal: number;
}

/**
 * Uppercases, strips diacritics (é→E), and treats every non A–Z character as a
 * word boundary (spaces, hyphens, apostrophes…). The word split matters for the
 * Y rule; letter values are unaffected by it.
 */
export function analyzeName(fullName: string): NameAnalysis {
  const words = fullName
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean);

  if (words.length === 0) {
    throw new RangeError("analyzeName: name must contain at least one A-Z letter");
  }

  const letters: NameLetter[] = [];
  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const letter = word[i] as string; // split guarantees A-Z only
      letters.push({
        letter,
        value: letterValue(letter),
        isVowel: classifyVowel(letter, word[i - 1], word[i + 1]),
      });
    }
  }

  let total = 0;
  let vowelTotal = 0;
  for (const l of letters) {
    total += l.value;
    if (l.isVowel) vowelTotal += l.value;
  }
  return { letters, total, vowelTotal, consonantTotal: total - vowelTotal };
}

// ── §2 Reduction ─────────────────────────────────────────────────────────────

export interface Reduction {
  value: number;
  /** Every value the reduction passed through, starting with the input itself. */
  chain: number[];
}

export function isMasterNumber(n: number): boolean {
  return (MASTER_NUMBERS as readonly number[]).includes(n);
}

function digitSum(n: number): number {
  let sum = 0;
  for (let rest = n; rest > 0; rest = Math.floor(rest / 10)) {
    sum += rest % 10;
  }
  return sum;
}

/**
 * Sums digits repeatedly until a single digit, but stops at the master numbers
 * 11 / 22 / 33. The chain (input included) is what karmic-debt detection reads.
 */
export function reduceWithTrace(n: number): Reduction {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`reduceWithTrace: expected a non-negative integer, got ${n}`);
  }
  const chain = [n];
  let value = n;
  while (value > 9 && !isMasterNumber(value)) {
    value = digitSum(value);
    chain.push(value);
  }
  return { value, chain };
}

// ── §3 Core numbers ──────────────────────────────────────────────────────────

export interface NumerologyProfile {
  lifePath: number;
  lifePathIsMaster: boolean;
  birthday: number;
  expression: number;
  soulUrge: number;
  personality: number;
  personalYear: number;
  personalMonth: number;
  /** Sorted subset of [13, 14, 16, 19]. */
  karmicDebts: number[];
  breakdown: {
    dob: { month: number; day: number; year: number; reducedParts: [number, number, number] };
    nameLetters: NameLetter[];
  };
}

export interface ComputeProfileInput {
  fullBirthName: string;
  /** YYYY-MM-DD (zero-padded). */
  dob: string;
  /** Reference date for Personal Year/Month (defaults to now; report passes render time). */
  now?: Date;
}

function parseDob(dob: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) {
    throw new RangeError(`parseDob: "${dob}" is not in YYYY-MM-DD format`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  if (!isReal) {
    throw new RangeError(`parseDob: "${dob}" is not a real calendar date`);
  }
  return { year, month, day };
}

export function computeProfile(input: ComputeProfileInput): NumerologyProfile {
  const { year, month, day } = parseDob(input.dob);
  const name = analyzeName(input.fullBirthName);

  const reducedMonth = reduceWithTrace(month);
  const reducedDay = reduceWithTrace(day);
  const reducedYear = reduceWithTrace(year);
  const lifePath = reduceWithTrace(reducedMonth.value + reducedDay.value + reducedYear.value);

  const expression = reduceWithTrace(name.total);
  const soulUrge = reduceWithTrace(name.vowelTotal);
  const personality = reduceWithTrace(name.consonantTotal);

  // Karmic debts read birth-derived chains only.
  // DECISION: personal year/month chains are excluded — they change with the
  // calendar and karmic debts must be stable facts of the birth data.
  const karmicDebts = [
    ...new Set(
      [reducedMonth, reducedDay, reducedYear, lifePath, expression, soulUrge, personality]
        .flatMap((r) => r.chain)
        .filter((v) => (KARMIC_DEBT_NUMBERS as readonly number[]).includes(v)),
    ),
  ].sort((a, b) => a - b);

  // DECISION: personal year/month use UTC calendar fields — deterministic on
  // the server regardless of host timezone; boundary drift is ±1 day at New Year.
  const now = input.now ?? new Date();
  const personalYear = reduceWithTrace(
    reducedMonth.value + reducedDay.value + reduceWithTrace(now.getUTCFullYear()).value,
  );
  const personalMonth = reduceWithTrace(personalYear.value + now.getUTCMonth() + 1);

  return {
    lifePath: lifePath.value,
    lifePathIsMaster: isMasterNumber(lifePath.value),
    birthday: reducedDay.value,
    expression: expression.value,
    soulUrge: soulUrge.value,
    personality: personality.value,
    personalYear: personalYear.value,
    personalMonth: personalMonth.value,
    karmicDebts,
    breakdown: {
      dob: {
        month,
        day,
        year,
        reducedParts: [reducedMonth.value, reducedDay.value, reducedYear.value],
      },
      nameLetters: name.letters,
    },
  };
}
