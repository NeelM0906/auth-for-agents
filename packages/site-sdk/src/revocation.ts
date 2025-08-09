export interface RevocationChecker {
  isRevoked(jti: string): Promise<boolean>;
}

export class InMemoryRevocations implements RevocationChecker {
  private revoked = new Set<string>();
  add(jti: string) { this.revoked.add(jti); }
  async isRevoked(jti: string): Promise<boolean> { return this.revoked.has(jti); }
}


