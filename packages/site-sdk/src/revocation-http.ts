import type { RevocationChecker } from './revocation';

export class HttpRevocations implements RevocationChecker {
  private cache = new Set<string>();
  private fetchedAt = 0;
  constructor(private url: string, private ttlMs = 30_000) {}
  async isRevoked(jti: string): Promise<boolean> {
    const now = Date.now();
    if (now - this.fetchedAt > this.ttlMs) {
      try {
        const res = await fetch(this.url);
        if (res.ok) {
          const data = await res.json();
          this.cache = new Set<string>(data.jtis || []);
          this.fetchedAt = now;
        }
      } catch {}
    }
    return this.cache.has(jti);
  }
}


