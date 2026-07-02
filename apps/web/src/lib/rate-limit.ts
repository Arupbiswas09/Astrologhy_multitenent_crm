import "server-only";

/**
 * In-memory token bucket per IP (docs/02 §7, docs/08 §5: 5 posts/min/IP).
 * Per-instance state is acceptable at this scale — a distributed limiter is
 * a drop-in swap later without touching call sites.
 */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const CAPACITY = 5;
const REFILL_PER_MS = CAPACITY / 60_000; // full refill every minute
const MAX_BUCKETS = 10_000;

const buckets = new Map<string, Bucket>();

export function allowRequest(ip: string, now = Date.now()): boolean {
  if (buckets.size > MAX_BUCKETS) {
    // Opportunistic pressure valve: drop stale buckets (>2min untouched).
    for (const [key, bucket] of buckets) {
      if (now - bucket.updatedAt > 120_000) buckets.delete(key);
    }
    if (buckets.size > MAX_BUCKETS) buckets.clear();
  }

  const bucket = buckets.get(ip) ?? { tokens: CAPACITY, updatedAt: now };
  const refilled = Math.min(CAPACITY, bucket.tokens + (now - bucket.updatedAt) * REFILL_PER_MS);
  if (refilled < 1) {
    buckets.set(ip, { tokens: refilled, updatedAt: now });
    return false;
  }
  buckets.set(ip, { tokens: refilled - 1, updatedAt: now });
  return true;
}

/** Test hook. */
export function resetRateLimiter(): void {
  buckets.clear();
}
