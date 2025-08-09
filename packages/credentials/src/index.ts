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


