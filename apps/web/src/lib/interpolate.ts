/**
 * Quiz copy interpolation (docs/05): `{{first_name}}` becomes available from
 * step 4 onward. Report-side interpolation is richer and lives in
 * @astro-note/report-composer — this one is only for quiz screens.
 */

/** First word of the full birth name, title-cased. */
export function deriveFirstName(fullName: string | undefined | null): string | null {
  const word = (fullName ?? "").trim().split(/\s+/)[0] ?? "";
  const letters = word.replace(/[^\p{L}'-]/gu, "");
  if (!letters) return null;
  return letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase();
}

/** Replace {{first_name}}; degrade gracefully when the name isn't known yet. */
export function interpolateQuizCopy(text: string, firstName: string | null): string {
  if (!text.includes("{{")) return text;
  if (firstName) return text.replaceAll("{{first_name}}", firstName);
  return text
    .replace(/\{\{first_name\}\},\s*/g, "") // "{{first_name}}, what's…" → "What's…"
    .replaceAll("{{first_name}}", "you")
    .replace(/^([a-z])/, (c) => c.toUpperCase());
}
