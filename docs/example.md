### Robots.txt Builder — End-to-End Run and Test Guide

#### Prerequisites
- Node >= 20
- From repo root:
```
cd /Users/zidane/Desktop/Projects/AA
npm install
```

### 1) Start the API (port 4005)
Terminal A:
```
POLICY_BUILDER_API_PORT=4005 node /Users/zidane/Desktop/Projects/AA/services/policy-builder-api/dist/start.js
```
Expected log:
- `[policy-builder-api] listening on :4005`

Health check:
```
curl -sS http://localhost:4005/templates | jq .
```

What this service does:
- Generates policies from builder configs, generates platform code, serves templates, and has stubs for analytics/deployment.

### 2) Start the Frontend (port 3003)
Terminal B:
```
cd /Users/zidane/Desktop/Projects/AA/examples/robots-builder
NEXT_PUBLIC_POLICY_BUILDER_API_BASE=http://localhost:4005 npm run dev -- -p 3003
```
Open:
- `http://localhost:3003` (redirects to `/builder`)
- `http://localhost:3003/builder`

Expected:
- Resource input, agent list, RPM=600 default, live “Policy Preview”. Click “Add” after typing a resource (e.g., `/products/*`).

---

## API Testing (Requests + Meaning)

### A) List templates
```
curl -sS http://localhost:4005/templates | jq .
```
200 OK with templates like “E-commerce Store”.

### B) Generate a Policy (valid)
```
curl -sS -X POST http://localhost:4005/policies/generate \
  -H 'content-type: application/json' \
  -d '{
    "origin":"https://example.com",
    "resources":[{"pattern":"/products/*"}],
    "rateLimits":[{"scope":"agent+principal","rpm":600}]
  }' | jq .
```
200 OK Policy JSON:
- version: `0.1`
- issuer_metadata: placeholder issuer/JWKS
- supported_auth: `dpop_jwt`
- operations: resource → `https://example.com/products/*`, actions [`read`], required_scopes [`content:read`]
- rate_limits: key `agent+principal`, rpm `600` (default/capped)
- enforcement: `reject_on_missing_agent_identity: true`

RPM cap behavior:
```
curl -sS -X POST http://localhost:4005/policies/generate \
  -H 'content-type: application/json' \
  -d '{
    "origin":"https://example.com",
    "resources":[{"pattern":"/products/*"}],
    "rateLimits":[{"scope":"agent+principal","rpm":9999}]
  }' | jq '.rate_limits'
```
Response shows rpm `600` (server caps values > 600).

### C) Generate Platform Code (Express)
```
curl -sS -X POST http://localhost:4005/policies/generate-code \
  -H 'content-type: application/json' \
  -d '{
    "platform":"express",
    "builderConfig":{
      "origin":"https://example.com",
      "resources":[{"pattern":"/**"}],
      "rateLimits":[{"scope":"agent+principal","rpm":600}]
    }
  }' | jq .
```
200 OK with:
- files: `middleware/auth-for-agents.js`, `public/.well-known/agents`
- installCommands: `["npm install @auth4agents/site-sdk"]`
- integrationCode: `app.use('/api', authMiddleware);`

Try other platforms (Cloudflare/Nginx/WordPress):
```
# Cloudflare Worker
curl -sS -X POST http://localhost:4005/policies/generate-code \
  -H 'content-type: application/json' \
  -d '{"platform":"cloudflare","builderConfig":{"origin":"https://example.com","resources":[{"pattern":"/**"}]}}' | jq '.files[0].path,.files[0].content' -r

# Nginx
curl -sS -X POST http://localhost:4005/policies/generate-code \
  -H 'content-type: application/json' \
  -d '{"platform":"nginx","builderConfig":{"origin":"https://example.com","resources":[{"pattern":"/**"}]}}' | jq '.files[0].path,.files[0].content' -r

# WordPress
curl -sS -X POST http://localhost:4005/policies/generate-code \
  -H 'content-type: application/json' \
  -d '{"platform":"wordpress","builderConfig":{"origin":"https://example.com","resources":[{"pattern":"/**"}]}}' | jq '.files[0].path,.files[0].content' -r
```

### D) Analytics (no-op)
```
curl -i -sS -X POST http://localhost:4005/analytics/events \
  -H 'content-type: application/json' \
  -d '{"event":"builder_opened"}'
```
Expected: 204 No Content.

### E) Deployment (stub)
```
curl -sS -X POST http://localhost:4005/deployment/vercel \
  -H 'content-type: application/json' \
  -d '{"policy":{"version":"0.1","issuer_metadata":[{"issuer":"https://issuer.example.com","jwks_uri":"https://issuer.example.com/.well-known/jwks.json"}],"supported_auth":["dpop_jwt"],"operations":[{"resource":"https://example.com/**","actions":["read"],"required_scopes":["content:read"]}],"enforcement":{"reject_on_missing_agent_identity":true}},"config":{"token":"xxx","projectId":"yyy"}}' | jq .
```
Expected: `{"url":"https://deploy-preview.example.com","status":"created"}` (stub).

---

## Frontend Usage (Builder)
1) Open `http://localhost:3003/builder`
2) Enter a resource (e.g., `/products/*`) and click “Add”
3) Set RPM (0–600, default 600)
4) Review “Policy Preview” — this is your `/.well-known/agents` policy

Notes:
- Agents list is informational for now; PermissionMatrix is stubbed (no agent-specific rules yet)
- Origin defaults to `https://example.com`; we can add an origin input next

---

## Troubleshooting
- 404 on `/`: use `/builder` (we added an index redirect)
- Next.js ModuleParseError: ensure `examples/robots-builder/next.config.mjs` contains:
```
export default { transpilePackages: ['@auth4agents/policy'] };
```
- Port conflicts:
```
pkill -f services/policy-builder-api/dist/start.js || true
pkill -f "next dev" || true
```
Then pick another frontend port, e.g. `-p 3010`.


