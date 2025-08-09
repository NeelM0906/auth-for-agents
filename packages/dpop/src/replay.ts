export interface ReplayCache {
  has(jti: string): Promise<boolean>;
  add(jti: string, expSec: number): Promise<void>;
}

export class InMemoryReplayCache implements ReplayCache {
  private entries = new Map<string, number>();
  async has(jti: string): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const exp = this.entries.get(jti);
    if (!exp) return false;
    if (exp < now) { this.entries.delete(jti); return false; }
    return true;
  }
  async add(jti: string, expSec: number): Promise<void> {
    this.entries.set(jti, expSec);
  }
}


