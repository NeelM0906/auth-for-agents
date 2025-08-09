import { createRemoteJWKSet, JWTVerifyResult, jwtVerify, SignJWT, calculateJwkThumbprint, importJWK, type JWK } from 'jose';
import { z } from 'zod';

// Claims
export const AgentIdentityClaimsSchema = z.object({
  iss: z.string().url(),
  sub: z.string(), // DID or key thumbprint
  aud: z.string().url(),
  exp: z.number(),
  iat: z.number().optional(),
  act: z.string().optional(), // controller/org id
  ai_level: z.enum(['none', 'basic', 'kyc']).optional(),
  software_id: z.string().optional(),
  software_version: z.string().optional(),
  cnf: z.object({ jkt: z.string() })
});

export type AgentIdentityClaims = z.infer<typeof AgentIdentityClaimsSchema>;

export const CapabilityClaimsSchema = z.object({
  iss: z.string().url(),
  sub: z.string(), // principal id
  aud: z.string().url(),
  exp: z.number(),
  nbf: z.number().optional(),
  iat: z.number().optional(),
  jti: z.string(),
  cnf: z.object({ jkt: z.string() }),
  att: z.array(z.object({ resource: z.string(), actions: z.array(z.string()).min(1), scopes: z.array(z.string()).min(1) })).min(1),
  caveats: z.object({ rate: z.number().optional(), endpoints: z.array(z.string()).optional(), data_classes: z.array(z.string()).optional(), max_cost: z.number().optional(), exp: z.number().optional() }).optional(),
  parent: z.string().optional()
});

export type CapabilityClaims = z.infer<typeof CapabilityClaimsSchema>;

// Verify helpers
export async function verifyAgentIdentity(jwt: string, issuer: string): Promise<JWTVerifyResult<AgentIdentityClaims>> {
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  const res = await jwtVerify(jwt, jwks, { audience: undefined });
  const claims = AgentIdentityClaimsSchema.parse(res.payload);
  return { ...res, payload: claims } as JWTVerifyResult<AgentIdentityClaims>;
}

export async function verifyCapability(jwt: string, issuer: string, audience?: string): Promise<JWTVerifyResult<CapabilityClaims>> {
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  const res = await jwtVerify(jwt, jwks, audience ? { audience } : {});
  const claims = CapabilityClaimsSchema.parse(res.payload);
  return { ...res, payload: claims } as JWTVerifyResult<CapabilityClaims>;
}

export function assertBoundKeys(ai: AgentIdentityClaims, cap: CapabilityClaims) {
  if (ai.cnf?.jkt !== cap.cnf?.jkt) {
    throw new Error('binding_mismatch: ai.cnf.jkt != cap.cnf.jkt');
  }
}

// Sign helpers (for issuer)
export async function signAgentIdentity(claims: Omit<AgentIdentityClaims, 'cnf'> & { cnf: { jkt: string } }, jwk: JWK): Promise<string> {
  AgentIdentityClaimsSchema.parse(claims);
  const key = await importJWK(jwk, keyAlgFromJwk(jwk));
  return await new SignJWT(claims as any).setProtectedHeader({ alg: keyAlgFromJwk(jwk), kid: (jwk as any).kid }).sign(key);
}

export async function signCapability(claims: CapabilityClaims, jwk: JWK): Promise<string> {
  CapabilityClaimsSchema.parse(claims);
  const key = await importJWK(jwk, keyAlgFromJwk(jwk));
  return await new SignJWT(claims as any).setProtectedHeader({ alg: keyAlgFromJwk(jwk), kid: (jwk as any).kid }).sign(key);
}

export async function computeJkt(jwk: JWK): Promise<string> {
  return await calculateJwkThumbprint(jwk, 'sha256');
}

function keyAlgFromJwk(jwk: JWK): string {
  if (jwk.kty === 'OKP' && (jwk as any).crv === 'Ed25519') return 'EdDSA';
  if (jwk.kty === 'EC' && (jwk as any).crv === 'P-256') return 'ES256';
  if (jwk.kty === 'RSA') return 'RS256';
  throw new Error('unsupported_jwk');
}

// no extra wrapper needed; using jose.importJWK directly above

// ---------------- Hybrid/Privacy/Enterprise/Capabilities ----------------

// Zero-knowledge verified credential placeholder types
export const ZKIdentityProofSchema = z.object({
  commitment: z.string(),
  nullifier: z.string(),
  merkleProof: z.string()
});

export const VerifiedCredentialSchema = z.object({
  zkProof: ZKIdentityProofSchema,
  humanHash: z.string(),
  verificationLevel: z.enum(['email', 'phone', 'email+phone', 'government_id']),
  jurisdictionCode: z.string(),
  issueTimestamp: z.number(),
  expiryTimestamp: z.number()
});
export type VerifiedCredential = z.infer<typeof VerifiedCredentialSchema>;

export const DelegationLinkSchema = z.object({
  delegator: z.string(),
  delegatee: z.string(),
  permissions: z.array(z.string()),
  constraints: z.array(z.string()).default([]),
  validityPeriod: z.object({ from: z.number(), to: z.number() }),
  revocationConditions: z.array(z.string()).default([])
});

export const ResourceLimitSchema2 = z.object({
  resource: z.enum(['api_calls', 'data_volume', 'cost_usd']),
  limit: z.number(),
  period: z.enum(['hour', 'day', 'month']),
  rollover: z.boolean().default(false)
});

export const OrganizationalCredentialSchema = z.object({
  organizationId: z.string(),
  humanOperator: z.object({ sub: z.string() }),
  delegationChain: z.array(DelegationLinkSchema),
  scopeConstraints: z.array(z.string()).default([]),
  budgetLimits: z.array(ResourceLimitSchema2).default([])
});
export type OrganizationalCredential = z.infer<typeof OrganizationalCredentialSchema>;

export const CapabilityDescriptorSchema = z.object({
  category: z.enum(['data_access', 'content_generation', 'communication', 'computation']),
  specificAction: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  dataPermissions: z.object({ canRead: z.array(z.string()).default([]), canWrite: z.array(z.string()).default([]), canDelete: z.array(z.string()).default([]) }),
  networkPermissions: z.object({ allowedDomains: z.array(z.string()).default([]), blockedDomains: z.array(z.string()).default([]), rateLimits: z.array(z.object({ domain: z.string(), rpm: z.number().optional(), rph: z.number().optional() })).default([]), protocols: z.array(z.enum(['http', 'https', 'websocket'])).default(['https']) }),
  computePermissions: z.object({ maxMemoryMB: z.number().default(256), maxCpuTimeMs: z.number().default(1000), allowedModules: z.array(z.string()).default([]), sandboxLevel: z.enum(['none', 'process', 'vm', 'container']).default('process') })
});

export const CapabilityTokenSchema = z.object({
  capability: CapabilityDescriptorSchema,
  resourceScope: z.object({ urlPatterns: z.array(z.string()).default([]), domSelectors: z.array(z.string()).default([]), apiEndpoints: z.array(z.string()).default([]), fileTypes: z.array(z.string()).default([]) }),
  temporalConstraints: z.array(z.object({ from: z.number().optional(), to: z.number().optional() })).default([]),
  usageCounter: z.object({ max: z.number().optional(), used: z.number().default(0) }).default({ used: 0 }),
  revocationConditions: z.array(z.string()).default([])
});
export type CapabilityToken = z.infer<typeof CapabilityTokenSchema>;

export const HybridAgentCredentialSchema = z.object({
  identity: z.object({ zkProof: ZKIdentityProofSchema, verificationLevel: z.enum(['email', 'phone', 'email+phone', 'government_id']), riskScore: z.number().min(0).max(1) }),
  context: z.object({ type: z.enum(['individual', 'organizational']), organizationId: z.string().optional(), delegationChain: z.array(DelegationLinkSchema).optional(), budgetConstraints: z.array(ResourceLimitSchema2).optional() }),
  capabilities: z.object({ tokens: z.array(CapabilityTokenSchema).default([]), intentPolicies: z.array(z.any()).default([]), behavioralConstraints: z.any().optional() }),
  temporal: z.object({ issued: z.number(), expires: z.number(), refreshPolicy: z.any().optional() }),
  security: z.object({ bindingKeys: z.any(), revocationEndpoints: z.array(z.string()).default([]), auditLevel: z.enum(['minimal', 'standard', 'comprehensive']).default('standard') })
});
export type HybridAgentCredential = z.infer<typeof HybridAgentCredentialSchema>;

// Placeholder verifiers (non-cryptographic stubs for MVP). Replace with real zk verification libs.
export function verifyVerifiedCredential(vc: VerifiedCredential): boolean {
  const now = Date.now();
  VerifiedCredentialSchema.parse(vc);
  return vc.issueTimestamp <= now && vc.expiryTimestamp > now;
}



