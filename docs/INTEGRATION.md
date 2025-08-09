## Integration quickstart

### Site (Express)
1) Serve a policy at `/.well-known/agents`.
2) Mount the middleware.

```ts
import { agentAuthMiddleware } from '@auth4agents/site-sdk/src/express';
import { InMemoryRateLimiter } from '@auth4agents/site-sdk/src/rate';
app.use(agentAuthMiddleware({
  policyUrl: 'https://your.site/.well-known/agents',
  acceptedIssuers: ['https://issuer.example'],
  rateLimiter: new InMemoryRateLimiter()
}));
```

### Agent (Node)
```ts
import { dpopFetch, createAgentKeys } from '@auth4agents/agent-sdk';
const { dpop } = await createAgentKeys();
// obtain ai and cap from your issuer
const res = await dpopFetch('https://your.site/resource', { method: 'GET', dpopKey: dpop, ai, cap });
```


