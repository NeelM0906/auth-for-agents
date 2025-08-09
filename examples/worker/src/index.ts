import { validateAgent } from '@auth4agents/site-sdk/src/worker';
import { InMemoryRateLimiter } from '@auth4agents/site-sdk/src/rate';
import { HttpRevocations } from '@auth4agents/site-sdk/src/revocation-http';

const rate = new InMemoryRateLimiter();

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/.well-known/agents') {
      return Response.json({
        version: '0.1',
        issuer_metadata: [{ issuer: 'http://localhost:4000', jwks_uri: 'http://localhost:4000/.well-known/jwks.json' }],
        supported_auth: ['dpop_jwt'],
        operations: [
          { resource: `${url.origin}/v1/orders/*`, actions: ['read'], required_scopes: ['orders:read'] },
          { resource: `${url.origin}/v1/orders`, actions: ['write'], required_scopes: ['orders:write'] }
        ],
        rate_limits: [{ key: 'agent+principal', resource: `${url.origin}/v1/orders/*`, limit: { rpm: 30 } }],
        enforcement: { reject_on_missing_agent_identity: true }
      });
    }

    if (url.pathname.startsWith('/v1/orders')) {
      const ctx = await validateAgent(req, {
        policyUrl: new URL('/.well-known/agents', url.origin).toString(),
        acceptedIssuers: ['http://localhost:4000'],
        rateLimiter: rate,
        revocations: new HttpRevocations('http://localhost:4000/revocations')
      });
      if (!ctx.allowed) return new Response(JSON.stringify(ctx.error), { status: ctx.status, headers: { 'content-type': 'application/json' } });
      if (req.method === 'GET') return Response.json({ id: url.pathname.split('/').pop(), status: 'ok' });
      if (req.method === 'POST') return new Response(JSON.stringify({ id: 'ord_' + crypto.randomUUID() }), { status: 201, headers: { 'content-type': 'application/json' } });
      return new Response('not allowed', { status: 405 });
    }

    return new Response('ok');
  }
} satisfies ExportedHandler;


