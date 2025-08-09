export type RateDecision = { allowed: true; remaining?: number } | { allowed: false; retryAfterSec?: number };

export interface RateLimiter {
  check(key: string, opts: { rpm?: number; rph?: number }): Promise<RateDecision>;
}

export class InMemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, { minute: number; hour: number; mCount: number; hCount: number }>();

  async check(key: string, opts: { rpm?: number; rph?: number }): Promise<RateDecision> {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const hour = Math.floor(now / 3600000);
    const rec = this.buckets.get(key) ?? { minute, hour, mCount: 0, hCount: 0 };
    if (rec.minute !== minute) { rec.minute = minute; rec.mCount = 0; }
    if (rec.hour !== hour) { rec.hour = hour; rec.hCount = 0; }
    const nextM = rec.mCount + 1;
    const nextH = rec.hCount + 1;
    if (opts.rpm && nextM > opts.rpm) return { allowed: false, retryAfterSec: 60 - (Math.floor(now/1000) % 60) };
    if (opts.rph && nextH > opts.rph) return { allowed: false, retryAfterSec: 3600 - (Math.floor(now/1000) % 3600) };
    rec.mCount = nextM; rec.hCount = nextH; this.buckets.set(key, rec);
    const remaining = Math.min(
      opts.rpm ? Math.max(opts.rpm - rec.mCount, 0) : Number.MAX_SAFE_INTEGER,
      opts.rph ? Math.max(opts.rph - rec.hCount, 0) : Number.MAX_SAFE_INTEGER
    );
    return { allowed: true, remaining: Number.isFinite(remaining) ? remaining : undefined };
  }
}


