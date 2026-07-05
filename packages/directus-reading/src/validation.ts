import { z } from "zod";

/** Request schema for POST /reading/lead (ported from apps/web /api/lead). */
export const leadSchema = z.object({
  tenant: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/),
  email: z.string().trim().toLowerCase().email().max(254),
  consent_marketing: z.boolean().default(false),
  website: z.string().max(0, "spam"), // honeypot — must be empty
  answers: z
    .record(z.string().max(64), z.string().max(200))
    .refine((a) => Object.keys(a).length <= 24, "too many answers"),
  utm: z.record(z.string().max(64), z.string().max(200)).optional().default({}),
});

export type LeadInput = z.infer<typeof leadSchema>;

export function isRealDate(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

export function validateDob(dob: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return "Missing or malformed birth date.";
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1920 || year > 2015) return "Birth year out of range.";
  if (!isRealDate(year, month, day)) return "That date doesn't exist.";
  return null;
}

export function validateFullName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Name is required.";
  if (trimmed.length > 80) return "Name too long.";
  const words = trimmed.split(/\s+/).filter((w) => /\p{L}/u.test(w));
  if (words.length < 2) return "Please enter your full birth name.";
  return null;
}

/** First word of the full birth name, title-cased. */
export function deriveFirstName(fullName: string): string | null {
  const word = (fullName ?? "").trim().split(/\s+/)[0] ?? "";
  const letters = word.replace(/[^\p{L}'-]/gu, "");
  if (!letters) return null;
  return letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase();
}
