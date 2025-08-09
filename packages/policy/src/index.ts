import { z } from 'zod';

// Types
export const IssuerMetadataSchema = z.object({
  issuer: z.string().url(),
  jwks_uri: z.string().url()
});

export const OperationSchema = z.object({
  resource: z.string(), // URL or pattern (supports * at path-segment level)
  actions: z.array(z.enum(['read', 'write', 'delete', 'list', 'execute'])).min(1),
  required_scopes: z.array(z.string()).min(1)
});

export const RateLimitSchema = z.object({
  key: z.enum(['agent', 'principal', 'agent+principal']).default('agent+principal'),
  resource: z.string(),
  limit: z.object({ rpm: z.number().int().positive().optional(), rph: z.number().int().positive().optional() })
});

export const EnforcementSchema = z.object({
  reject_on_missing_agent_identity: z.boolean().default(true)
});

export const PolicySchema = z.object({
  version: z.literal('0.1'),
  issuer_metadata: z.array(IssuerMetadataSchema).min(1),
  supported_auth: z.array(z.literal('dpop_jwt')).min(1),
  operations: z.array(OperationSchema).min(1),
  rate_limits: z.array(RateLimitSchema).optional(),
  pricing: z.object({ unit: z.string(), amount_usd: z.number().nonnegative() }).optional(),
  contact: z.string().optional(),
  enforcement: EnforcementSchema.default({ reject_on_missing_agent_identity: true })
});

export type Policy = z.infer<typeof PolicySchema>;
export type Operation = z.infer<typeof OperationSchema>;

// Validator
export function validatePolicy(input: unknown): Policy {
  const parsed = PolicySchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Invalid policy: ${message}`);
  }
  return parsed.data;
}

// Loader with trivial caching
const policyCache = new Map<string, { policy: Policy; fetchedAtMs: number }>();

export async function loadPolicyFromUrl(url: string, cacheTtlMs = 60_000): Promise<Policy> {
  const cached = policyCache.get(url);
  const now = Date.now();
  if (cached && now - cached.fetchedAtMs < cacheTtlMs) {
    return cached.policy;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch policy: ${res.status}`);
  const json = await res.json();
  const policy = validatePolicy(json);
  policyCache.set(url, { policy, fetchedAtMs: now });
  return policy;
}

// Operation matcher
export type HttpRequestLike = { method: string; url: string };

export function matchOperation(policy: Policy, req: HttpRequestLike): Operation | null {
  const requestUrl = new URL(req.url);
  const method = req.method.toUpperCase();
  for (const op of policy.operations) {
    const resource = new URL(op.resource);
    if (resource.origin !== requestUrl.origin) continue;
    if (!pathPatternMatch(resource.pathname, requestUrl.pathname)) continue;
    if (!actionMatchesMethod(op.actions, method)) continue;
    return op;
  }
  return null;
}

function actionMatchesMethod(actions: Operation['actions'], method: string): boolean {
  const map: Record<string, Array<'read' | 'write' | 'delete' | 'list' | 'execute'>> = {
    GET: ['read', 'list'],
    HEAD: ['read'],
    OPTIONS: ['read'],
    POST: ['write', 'execute'],
    PUT: ['write'],
    PATCH: ['write'],
    DELETE: ['delete']
  };
  const allowed = map[method] || [];
  return actions.some(a => allowed.includes(a));
}

function pathPatternMatch(patternPath: string, actualPath: string): boolean {
  // Supports '*' matching a single path segment; '**' matches the remainder
  const patternSegs = patternPath.split('/').filter(Boolean);
  const actualSegs = actualPath.split('/').filter(Boolean);
  let i = 0;
  for (; i < patternSegs.length; i++) {
    const p = patternSegs[i];
    const a = actualSegs[i];
    if (p === '**') return true;
    if (p === '*') {
      if (a == null) return false;
      continue;
    }
    if (p !== a) return false;
  }
  return i === actualSegs.length || patternSegs[patternSegs.length - 1] === '**';
}


