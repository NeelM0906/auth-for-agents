import express from 'express';
import { agentAuthMiddleware } from '@auth4agents/site-sdk/src/express';
import { InMemoryRateLimiter } from '@auth4agents/site-sdk/src/rate';
import { MemoryAuditSink } from '@auth4agents/site-sdk/src/audit';

const app = express();
const rate = new InMemoryRateLimiter();
const audit = new MemoryAuditSink();

app.use(express.json());
// Mount protected routes after policy route so the policy is public
app.get('/.well-known/agents', (_req, res) => {
  res.type('application/json').send(
    JSON.stringify(
      {
        version: '0.1',
        issuer_metadata: [{ issuer: 'http://localhost:4000', jwks_uri: 'http://localhost:4000/.well-known/jwks.json' }],
        supported_auth: ['dpop_jwt'],
        operations: [
          { resource: 'http://localhost:3000/v1/orders/*', actions: ['read'], required_scopes: ['orders:read'] },
          { resource: 'http://localhost:3000/v1/orders', actions: ['write'], required_scopes: ['orders:write'] }
        ],
        rate_limits: [{ key: 'agent+principal', resource: 'http://localhost:3000/v1/orders/*', limit: { rpm: 60 } }],
        enforcement: { reject_on_missing_agent_identity: true }
      },
      null,
      2
    )
  );
});

app.use(
  agentAuthMiddleware({
    policyUrl: 'http://localhost:3000/.well-known/agents',
    acceptedIssuers: ['http://localhost:4000'],
    rateLimiter: rate,
    audit
  })
);

app.get('/v1/orders/:id', (req, res) => {
  res.json({ id: req.params.id, status: 'ok' });
});

app.post('/v1/orders', (req, res) => {
  res.status(201).json({ id: 'ord_' + Math.random().toString(36).slice(2) });
});

// (policy route moved above)

app.listen(3000, () => console.log('Example API listening on :3000'));


