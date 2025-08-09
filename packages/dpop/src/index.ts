import { JWK, importJWK, SignJWT } from 'jose';
export { InMemoryReplayCache, type ReplayCache } from './replay';

export type DPoPProofOptions = {
  htm: string; // HTTP method
  htu: string; // HTTP target uri
  iat?: number;
  jti?: string; // unique per request
};

export async function createDpopProof(jwk: JWK, opts: DPoPProofOptions): Promise<string> {
  const key = await importJWK(jwk, jwkAlg(jwk));
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    htm: opts.htm.toUpperCase(),
    htu: opts.htu,
    iat: opts.iat ?? now,
    jti: opts.jti ?? crypto.randomUUID()
  } as const;
  return await new SignJWT(payload as any).setProtectedHeader({ alg: jwkAlg(jwk), typ: 'dpop+jwt', jwk }).sign(key);
}

export async function verifyDpopProof(proof: string, expected: { htm: string; htu: string; maxSkewSec?: number; replayCacheHas: (jti: string) => Promise<boolean>; replayCacheAdd: (jti: string, expSec: number) => Promise<void> }) {
  const parts: (string | undefined)[] = proof.split('.');
  if (parts.length !== 3) throw new Error('bad_dpop_format');
  const head = parts[0];
  if (!head) throw new Error('bad_dpop_format');
  const header = JSON.parse(Buffer.from(head.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  if (header.typ !== 'dpop+jwt' || !header.jwk) throw new Error('bad_dpop_header');
  const { jwtVerify } = await import('jose');
  const key = await importJWK(header.jwk, jwkAlg(header.jwk));
  const { payload } = await jwtVerify(proof, key, { typ: 'dpop+jwt' });
  const iat = Number(payload.iat);
  const jti = String(payload.jti);
  const now = Math.floor(Date.now() / 1000);
  const skew = expected.maxSkewSec ?? 300;
  if (Math.abs(now - iat) > skew) throw new Error('dpop_iat_out_of_window');
  if (String(payload.htm).toUpperCase() !== expected.htm.toUpperCase()) throw new Error('dpop_method_mismatch');
  if (String(payload.htu) !== expected.htu) throw new Error('dpop_url_mismatch');
  if (await expected.replayCacheHas(jti)) throw new Error('dpop_replay');
  await expected.replayCacheAdd(jti, now + skew);
  const jkt = await (await import('jose')).calculateJwkThumbprint(header.jwk, 'sha256');
  return { jkt, jwk: header.jwk as JWK };
}

function jwkAlg(jwk: JWK): string {
  if (jwk.kty === 'OKP' && (jwk as any).crv === 'Ed25519') return 'EdDSA';
  if (jwk.kty === 'EC' && (jwk as any).crv === 'P-256') return 'ES256';
  if (jwk.kty === 'RSA') return 'RS256';
  throw new Error('unsupported_jwk');
}


