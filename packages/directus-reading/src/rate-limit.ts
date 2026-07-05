/** In-memory token bucket per IP: 5 posts/min (docs/08 §5). Per-process. */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const CAPACITY = 5;
const REFILL_PER_MS = CAPACITY / 60_000;
const MAX_BUCKETS = 10_000;
const buckets = new Map<string, Bucket>();

export function allowRequest(ip: string, now = Date.now()): boolean {
  if (buckets.size > MAX_BUCKETS) {
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
