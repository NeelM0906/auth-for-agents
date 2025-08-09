export type AuditEvent = {
  version: '0.1';
  time: string;
  request: { method: string; path: string };
  agent?: { sub?: string; software_id?: string };
  principal?: { sub?: string };
  cap?: { jti?: string; scopes?: string[] };
  decision: { allowed: boolean; ratelimit?: { key: string; remaining?: number } };
  capability?: { enforced: boolean; reason?: string };
};

export interface AuditSink {
  write(event: AuditEvent): Promise<void>;
}

export class MemoryAuditSink implements AuditSink {
  public readonly events: AuditEvent[] = [];
  async write(event: AuditEvent): Promise<void> { this.events.push(event); }
}

// Node-only file sink with hash-chained entries and optional JWS signature
export class FileAuditSink implements AuditSink {
  private prevHash: string | null = null;
  constructor(private filePath: string, private signer?: { sign: (payload: Uint8Array) => Promise<string> }) {}
  async write(event: AuditEvent): Promise<void> {
    const { createHash } = await import('node:crypto');
    const lineObj: any = { event };
    const prev = this.prevHash || '0'.repeat(64);
    const body = JSON.stringify(event);
    const hash = createHash('sha256').update(prev + body).digest('hex');
    lineObj.prev = prev;
    lineObj.hash = hash;
    if (this.signer) {
      const enc = new TextEncoder().encode(hash);
      lineObj.sig = await this.signer.sign(enc);
    }
    const fs = await import('node:fs/promises');
    await fs.appendFile(this.filePath, JSON.stringify(lineObj) + '\n');
    this.prevHash = hash;
  }
}


