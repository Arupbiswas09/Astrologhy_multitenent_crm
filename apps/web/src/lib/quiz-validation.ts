/** Client-side step validation (docs/05 table + docs/03 validation JSON). */

export interface DobParts {
  year: number;
  month: number;
  day: number;
}

export function isRealDate({ year, month, day }: DobParts): boolean {
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
  );
}

export function validateDob(
  parts: DobParts,
  rules?: { min_year?: number; max_year?: number },
): string | null {
  const minYear = rules?.min_year ?? 1920;
  const maxYear = rules?.max_year ?? 2015;
  if (parts.year < minYear || parts.year > maxYear) {
    return `Pick a year between ${minYear} and ${maxYear}.`;
  }
  if (!isRealDate(parts)) return "That day doesn't exist in that month.";
  return null;
}

export function formatDob({ year, month, day }: DobParts): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function validateFullName(
  value: string,
  rules?: { min_words?: number; max_length?: number },
): string | null {
  const minWords = rules?.min_words ?? 2;
  const maxLength = rules?.max_length ?? 80;
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Your name unlocks the reading — it stays private.";
  if (trimmed.length > maxLength) return `Keep it under ${maxLength} characters.`;
  const words = trimmed.split(/\s+/).filter((w) => /\p{L}/u.test(w));
  if (words.length < minWords) {
    return "Please enter your full birth name — first and last.";
  }
  return null;
}

// Pragmatic RFC-lite: one @, no spaces, dot in a 2+ char TLD.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter your email to unlock your reading.";
  if (trimmed.length > 254 || !EMAIL_RE.test(trimmed)) {
    return "That email doesn't look right — check for typos.";
  }
  return null;
}
