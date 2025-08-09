import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import { generateKeyPair, exportJWK, JWK } from 'jose';
import { signAgentIdentity, signCapability } from '@auth4agents/credentials';

const app = Fastify({ logger: true });
await app.register(cors);
await app.register(formbody);

// Dev in-memory keys and state
let issuer = process.env.ISSUER_ORIGIN || 'http://localhost:4000';
let signingKey: JWK | null = null;
const revocations = new Set<string>();

async function getSigningKey(): Promise<JWK> {
  if (signingKey) return signingKey;
  const { privateKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
  const jwk = await exportJWK(privateKey);
  (jwk as any).kid = 'iss-' + Math.random().toString(36).slice(2, 10);
  signingKey = jwk as JWK;
  return signingKey;
}

app.get('/.well-known/jwks.json', async (_req, reply) => {
  const key = await getSigningKey();
  const { d, ...pub } = key as any;
  return reply.send({ keys: [pub] });
});

app.get('/revocations', async (_req, reply) => {
  return reply.send({ jtis: Array.from(revocations) });
});

app.post('/register-agent', async (req, reply) => {
  // Minimal noop for MVP
  return reply.send({ registered: true });
});

app.post('/token/agent-identity', async (req, reply) => {
  const { sub, aud, cnf } = (req.body as any) || {};
  if (!sub || !aud || !cnf?.jkt) return reply.code(400).send({ error: 'invalid_request' });
  const now = Math.floor(Date.now() / 1000);
  const key = await getSigningKey();
  const jwt = await signAgentIdentity(
    {
      iss: issuer,
      sub,
      aud,
      exp: now + 300,
      software_id: 'issuer.mvp',
      software_version: '0.1.0',
      cnf
    } as any,
    key
  );
  return reply.send({ token: jwt });
});

app.post('/token/delegation', async (req, reply) => {
  const { principal, aud, jkt, scopes } = (req.body as any) || {};
  if (!principal || !aud || !jkt || !Array.isArray(scopes)) return reply.code(400).send({ error: 'invalid_request' });
  const now = Math.floor(Date.now() / 1000);
  const key = await getSigningKey();
  const jti = crypto.randomUUID();
  const jwt = await signCapability(
    {
      iss: issuer,
      sub: principal,
      aud,
      exp: now + 1800,
      jti,
      cnf: { jkt },
      att: scopes.map((s: string) => ({ resource: aud + '/v1/orders*', actions: s.includes('write') ? ['write'] : ['read'], scopes: [s] }))
    } as any,
    key
  );
  return reply.send({ token: jwt, jti });
});

app.post('/revoke', async (req, reply) => {
  const { jti } = (req.body as any) || {};
  if (!jti) return reply.code(400).send({ error: 'invalid_request' });
  revocations.add(jti);
  return reply.send({ revoked: true });
});

app.listen({ port: 4000, host: '0.0.0.0' });


