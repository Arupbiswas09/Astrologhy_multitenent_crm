import "server-only";
import { resolveMx } from "node:dns/promises";
import disposableDomains from "disposable-email-domains";

/**
 * Server-side email quality gates (docs/08 §5): syntax is validated by zod
 * upstream; here we reject disposable domains and (fail-open) check MX.
 */

const DISPOSABLE = new Set<string>(disposableDomains);
const MX_TIMEOUT_MS = 800;

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (!domain) return true;
  // Check the domain and its parent (sub.tempmail.com → tempmail.com).
  const parts = domain.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    if (DISPOSABLE.has(parts.slice(i).join("."))) return true;
  }
  return false;
}

/**
 * True when the domain can plausibly receive mail. DNS failures/timeouts
 * fail OPEN (docs/08 §5) — a slow resolver must not lose real leads.
 */
export async function hasMxRecords(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const records = await Promise.race([
      resolveMx(domain),
      new Promise<"timeout">((resolve) =>
        setTimeout(() => resolve("timeout"), MX_TIMEOUT_MS).unref?.(),
      ),
    ]);
    if (records === "timeout") return true; // fail-open
    return records.length > 0;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    // Domain definitively doesn't exist / has no MX → real signal, reject.
    if (code === "ENOTFOUND" || code === "ENODATA") return false;
    return true; // resolver trouble → fail-open
  }
}
