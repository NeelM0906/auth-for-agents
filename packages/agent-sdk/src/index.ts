import { exportJWK, generateKeyPair, JWK } from 'jose';
import { createDpopProof } from '@auth4agents/dpop';

export type AgentKeys = { dpop: JWK };

export async function createAgentKeys(): Promise<AgentKeys> {
  const { privateKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
  const jwk = await exportJWK(privateKey);
  (jwk as any).kid = 'agent-' + Math.random().toString(36).slice(2, 8);
  return { dpop: jwk as JWK };
}

export async function dpopFetch(input: RequestInfo | URL, init: RequestInit & { dpopKey: JWK; ai: string; cap: string }): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  const method = (init.method || 'GET').toUpperCase();
  const proof = await createDpopProof(init.dpopKey, { htm: method, htu: url });
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${init.cap}`);
  headers.set('X-Agent-Identity', init.ai);
  headers.set('DPoP', proof);
  return fetch(input, { ...init, headers });
}


