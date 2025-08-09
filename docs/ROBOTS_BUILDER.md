## Robots.txt Builder — Visual Agent Policy & Integration Guide

This guide explains the visual builder, what it generates (policy JSON and code), and how to test and integrate it.

### What it does
- Lets you define resource patterns, agent types, permissions, and rate limits
- Produces a valid policy file at `/.well-known/agents`
- Generates platform-specific middleware or config (Express, Cloudflare Workers, Nginx, WordPress)

### Quickstart (local)
1) Start the API:
```
cd services/policy-builder-api
npm run dev
```
2) Start the app:
```
cd examples/robots-builder
npm run dev
```
3) Visit `http://localhost:3000/builder`

### Builder concepts
- Resources: path patterns (supports wildcards), e.g. `/products/*`
- Agents: built-in types (Googlebot, GPT crawler, price scrapers) or custom
- Permissions: allow, block, rate-limited, require-auth
- Rate limits: per minute/hour, per-agent or agent+principal keys

### Generated policy (example)
```
{
  "version": "0.1",
  "issuer_metadata": [
    { "issuer": "https://issuer.example.com", "jwks_uri": "https://issuer.example.com/.well-known/jwks.json" }
  ],
  "supported_auth": ["dpop_jwt"],
  "operations": [
    { "resource": "https://example.com/products/*", "actions": ["read"], "required_scopes": ["content:read"] }
  ],
  "rate_limits": [
    { "key": "agent+principal", "resource": "https://example.com/**", "limit": { "rpm": 60 } }
  ],
  "enforcement": { "reject_on_missing_agent_identity": true }
}
```

### Test a policy with cURL (server)
```
curl -sS -X POST http://localhost:4005/policies/generate \
  -H 'content-type: application/json' \
  -d '{
    "origin":"https://example.com",
    "resources":[{"pattern":"/products/*"}],
    "rateLimits":[{"scope":"agent+principal","rpm":60}]
  }'
```

### Generate platform code (server)
```
curl -sS -X POST http://localhost:4005/policies/generate-code \
  -H 'content-type: application/json' \
  -d '{
    "platform":"express",
    "builderConfig":{
      "origin":"https://example.com",
      "resources":[{"pattern":"/**"}],
      "rateLimits":[{"scope":"agent+principal","rpm":60}]
    }
  }'
```

### Validate via `@auth4agents/policy`
- The builder validates in real-time using the policy schema.
- The API also returns schema errors if invalid.

### Simulate with `@auth4agents/policy-tester`
```
import { PolicyTester, standardTests } from '@auth4agents/policy-tester';

const results = await new PolicyTester().testPolicy(policy, standardTests);
console.log(results);
```

### Platform integration outputs
- Express: middleware `auth-for-agents.js` + `public/.well-known/agents`
- Cloudflare Worker: `worker.js` + `public/.well-known/agents`
- Nginx: `nginx/agents.conf` (serves policy, example UA block)
- WordPress: plugin folder `wp-plugin/auth-for-agents`

See also:
- [Policy spec](./POLICY_SPEC.md)
- [Integration guide](./INTEGRATION.md)
- [Policy Builder API](./POLICY_BUILDER_API.md)
- [Integration Service API](./INTEGRATION_SERVICE_API.md)


