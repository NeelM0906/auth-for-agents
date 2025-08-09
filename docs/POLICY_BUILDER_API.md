## Policy Builder API

Base URL (local): `http://localhost:4005`

### POST /policies/generate
- Description: Generate and validate a Policy from a builder configuration
- Request body:
```
{
  "origin": "https://example.com",
  "resources": [{ "pattern": "/products/*", "description": "Product pages" }],
  "permissions": [{ "resource": "/products/*", "agentType": "googlebot", "permission": "allow" }],
  "rateLimits": [{ "scope": "agent+principal", "rpm": 60 }],
  "trustedIssuers": ["https://issuer.example.com"],
  "strictness": "strict"
}
```
- Responses:
  - 200: `Policy` JSON (validated)
  - 400: `{ error: string | object }`

### POST /policies/generate-code
- Description: Generate platform-specific code and artifacts
- Request body:
```
{
  "platform": "express" | "cloudflare" | "nginx" | "wordpress",
  "builderConfig": { ... same as /policies/generate ... }
}
```
- Response (200):
```
{
  "files": [{ "path": "...", "content": "..." }],
  "installCommands": ["npm install @auth4agents/site-sdk"],
  "integrationCode": "app.use('/api', authMiddleware);"
}
```
- Errors: 400 with `{ error }`

### GET /templates
- Description: List built-in site templates
- Response (200):
```
[
  { "id": "ecommerce", "name": "E-commerce Store", "description": "...", "riskProfile": "high" }
]
```

### POST /deployment/vercel
- Description: Create a Vercel deployment (stub)
- Body: `{ policy: Policy, config: { token: string, projectId: string } }`
- Response: `{ url: string, status: 'created' | 'failed' }`

### POST /analytics/events
- Description: Ingest analytics events (no-op, 204)

### Auth
- For now, no authentication (to be added: API key header `x-api-key`)


