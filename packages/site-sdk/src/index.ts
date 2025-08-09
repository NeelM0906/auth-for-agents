import { loadPolicyFromUrl, matchOperation, type Policy } from '@auth4agents/policy';
import { verifyAgentIdentity, verifyCapability, assertBoundKeys } from '@auth4agents/credentials';
import { verifyDpopProof } from '@auth4agents/dpop';
import { InMemoryReplayCache } from '@auth4agents/dpop';
import { errorResponse } from './errors';
import type { RateLimiter } from './rate';
import type { RevocationChecker } from './revocation';
import type { AuditSink } from './audit';

export type ValidatorOptions = {
  policyUrl: string;
  acceptedIssuers: string[];
  rateLimiter: RateLimiter;
  revocations?: RevocationChecker;
  audit?: AuditSink;
  // Capability enforcement toggles
  enforceCapabilities?: boolean;
};

export type ValidationResult =
  | { allowed: true; policy: Policy; context: any }
  | { allowed: false; status: number; error: { error: string; detail?: string } };

export async function validateRequest(req: Request, opts: ValidatorOptions): Promise<ValidationResult> {
  try {
    const ai = req.headers.get('x-agent-identity');
    const auth = req.headers.get('authorization');
    const dpop = req.headers.get('dpop');
    if (!ai || !auth || !dpop) return denied('missing_headers');

    const { scheme, token } = parseAuth(auth);
    if (scheme !== 'bearer') return denied('bad_auth_scheme');

    const policy = await loadPolicyFromUrl(opts.policyUrl);
    const op = matchOperation(policy, { method: req.method, url: req.url });
    if (!op) return denied('operation_not_allowed');

    const aiIssuer = issuerFrom(ai);
    const capIssuer = issuerFrom(token);
    if (!opts.acceptedIssuers.includes(aiIssuer) || !opts.acceptedIssuers.includes(capIssuer)) {
      return denied('token_invalid', 'unaccepted_issuer');
    }

    const aiRes = await verifyAgentIdentity(ai, aiIssuer);
    const capRes = await verifyCapability(token, capIssuer, new URL(req.url).origin);
    assertBoundKeys(aiRes.payload, capRes.payload);

    // DPoP verify and jkt compare
    const replay = new InMemoryReplayCache();
    const { jkt } = await verifyDpopProof(dpop, {
      htm: req.method,
      htu: req.url,
      replayCacheHas: (jti) => replay.has(jti),
      replayCacheAdd: (jti, exp) => replay.add(jti, exp)
    });
    if (jkt !== capRes.payload.cnf.jkt) return denied('binding_mismatch', 'dpop_jkt_mismatch');

    // scope check
    const hasScopes = op.required_scopes.every(s => capRes.payload.att.some(a => a.scopes.includes(s)));
    if (!hasScopes) return denied('insufficient_scope');

    // capability-based enforcement (optional, hybrid model)
    if (opts.enforceCapabilities) {
      const caps = capRes.payload.att.flatMap(a => a.scopes.map(sc => sc));
      // Basic check: if policy operation declares a capability tag, ensure present. For MVP, treat required_scopes as capability names, reuse above list.
      const ok = op.required_scopes.every(s => caps.includes(s));
      if (!ok) return denied('insufficient_scope', 'capability_missing');
    }

    // revocation
    if (opts.revocations && (await opts.revocations.isRevoked(capRes.payload.jti))) {
      return denied('revoked');
    }

    // rate limit (use first matching rate spec if any)
    const limitSpec = policy.rate_limits?.find(r => pathLike(r.resource) === pathLike(new URL(req.url).origin + new URL(req.url).pathname));
    const key = `${aiRes.payload.sub}|${capRes.payload.sub}|${new URL(req.url).pathname}`;
    if (limitSpec) {
      const rl = await opts.rateLimiter.check(key, limitSpec.limit);
      if (!rl.allowed) return denied('ratelimited');
    }

    await opts.audit?.write({
      version: '0.1',
      time: new Date().toISOString(),
      request: { method: req.method, path: new URL(req.url).pathname },
      agent: { sub: aiRes.payload.sub, software_id: aiRes.payload.software_id },
      principal: { sub: capRes.payload.sub },
      cap: { jti: capRes.payload.jti, scopes: capRes.payload.att.flatMap(a => a.scopes) },
      decision: { allowed: true }
    });

    return { allowed: true, policy, context: { ai: aiRes.payload, cap: capRes.payload, op } };
  } catch (e: any) {
    return denied('internal_error', e?.message);
  }
}

export function parseAuth(v: string): { scheme: string; token: string } {
  const [scheme = '', ...rest] = v.split(' ');
  return { scheme: scheme.toLowerCase(), token: rest.join(' ') };
}

function denied(code: Parameters<typeof errorResponse>[0], detail?: string): ValidationResult {
  const { status, body } = errorResponse(code, detail);
  return { allowed: false, status, error: body };
}

function issuerFrom(jwt: string): string {
  const mid = jwt.split('.')[1];
  if (!mid) throw new Error('token_invalid');
  const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(mid)));
  return payload.iss as string;
}

function base64urlDecode(b64: string): Uint8Array {
  const pad = b64.length % 4 === 2 ? '==' : b64.length % 4 === 3 ? '=' : '';
  const s = b64.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

function pathLike(s: string): string {
  try { const u = new URL(s); return u.origin + u.pathname; } catch { return s; }
}


