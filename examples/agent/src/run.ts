import { exportJWK, generateKeyPair } from 'jose';
import { computeJkt } from '@auth4agents/credentials';
import { createDpopProof } from '@auth4agents/dpop';

async function main() {
  const apiBase = 'http://localhost:3000';
  const issuerBase = 'http://localhost:4000';
  // Generate DPoP key for the agent
  const { publicKey: dpopPub, privateKey: dpopPriv } = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
  const dpopJwk = await exportJWK(dpopPriv);
  const jkt = await computeJkt(dpopJwk as any);

  // Obtain tokens from issuer service
  const aiRes = await fetch(`${issuerBase}/token/agent-identity`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sub: 'did:key:demo-agent', aud: apiBase, cnf: { jkt } })
  });
  if (!aiRes.ok) throw new Error('failed to get agent identity');
  const ai = (await aiRes.json()).token as string;

  const capRes = await fetch(`${issuerBase}/token/delegation`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ principal: 'org:demo', aud: apiBase, jkt, scopes: ['orders:read', 'orders:write'] })
  });
  if (!capRes.ok) throw new Error('failed to get capability');
  const cap = (await capRes.json()).token as string;

  // Allowed GET
  await call(apiBase + '/v1/orders/123', 'GET', ai, cap, dpopJwk as any);
  // Allowed POST
  await call(apiBase + '/v1/orders', 'POST', ai, cap, dpopJwk as any, { item: 'x' });
  // Blocked (missing scope): DELETE
  await call(apiBase + '/v1/orders/123', 'DELETE', ai, cap, dpopJwk as any);
}

async function call(url: string, method: string, ai: string, cap: string, dpopKey: any, body?: any) {
  const dpop = await createDpopProof(dpopKey, { htm: method, htu: url });
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${cap}`,
      'X-Agent-Identity': ai,
      DPoP: dpop,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  console.log(method, url, res.status, await res.text());
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});


