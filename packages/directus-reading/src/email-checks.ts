import { resolveMx } from "node:dns/promises";
import disposableDomains from "disposable-email-domains";

const DISPOSABLE = new Set<string>(disposableDomains as string[]);
const MX_TIMEOUT_MS = 800;

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (!domain) return true;
  const parts = domain.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    if (DISPOSABLE.has(parts.slice(i).join("."))) return true;
  }
  return false;
}

/** True if the domain can plausibly receive mail. DNS trouble fails OPEN. */
export async function hasMxRecords(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const records = await Promise.race([
      resolveMx(domain),
      new Promise<"timeout">((resolve) => {
        const t = setTimeout(() => resolve("timeout"), MX_TIMEOUT_MS);
        t.unref?.();
      }),
    ]);
    if (records === "timeout") return true;
    return records.length > 0;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") return false;
    return true;
  }
}
