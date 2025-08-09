## Integration quickstart

### Site (Express)
1) Serve a policy at `/.well-known/agents`.
2) Mount the middleware.

```ts
import { agentAuthMiddleware, InMemoryRateLimiter } from '@auth4agents/site-sdk';
app.use(agentAuthMiddleware({
  policyUrl: 'https://your.site/.well-known/agents',
  acceptedIssuers: ['https://issuer.example'],
  rateLimiter: new InMemoryRateLimiter()
}));
```

### More
- Robots Builder UI walkthrough: [ROBOTS_BUILDER.md](./ROBOTS_BUILDER.md)
- Policy Builder API: [POLICY_BUILDER_API.md](./POLICY_BUILDER_API.md)
- Integration Service API (generators): [INTEGRATION_SERVICE_API.md](./INTEGRATION_SERVICE_API.md)

### Agent (Node)
```ts
import { dpopFetch, createAgentKeys } from '@auth4agents/agent-sdk';
const { dpop } = await createAgentKeys();
// obtain ai and cap from your issuer
const res = await dpopFetch('https://your.site/resource', { method: 'GET', dpopKey: dpop, ai, cap });
```


