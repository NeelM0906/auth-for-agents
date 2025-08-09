## Auth for Agents

[![CI](https://github.com/NeelM0906/auth-for-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/NeelM0906/auth-for-agents/actions)

### Logo

// Add a logo at `docs/logo.png` and replace this line with an <img> tag.

### Short description

Auth for Agents is an open, minimal identity and authorization layer for AI agents. It lets websites and APIs safely identify agents, bind them to their controllers and principals, enforce site-declared policy, and maintain accountability with short-lived, DPoP-bound credentials.

### Vision

- **Problem**: Sites can’t reliably tell who is calling (human, benign agent, malicious bot), nor who authorized what. They default to CAPTCHAs and blocking. Agents rely on brittle scraping and static cookies/keys.
- **Our answer**: A standard, cryptographically verifiable fabric for agent identity and delegation that is easy to enforce at the edge (CDNs/WAFs) and integrates with existing IdPs.
- **Outcomes**: Safer, higher-throughput access for legitimate automation; precise revocation and audit; less friction for developers; compliance-ready attribution.

### Table of Contents

- [What’s included](#whats-included)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [Quickstart](#quickstart)
- [Policy format](#policy-format)
- [Headers and tokens](#headers-and-tokens)
- [Error codes](#error-codes)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

### What’s included

- Policy spec and loader (`@auth4agents/policy`)
- Credentials helpers for Agent Identity JWT and Capability JWT (`@auth4agents/credentials`)
- DPoP proof creation/verification (`@auth4agents/dpop`)
- Site-side enforcement SDK (Express middleware + Cloudflare Worker adapter) (`@auth4agents/site-sdk`)
- Agent SDK (Node) with `dpopFetch` (`@auth4agents/agent-sdk`)
- Issuer service (dev) with JWKS, token mint, and revocations (`services/issuer`)
- Examples: Express API, Cloudflare Worker, Agent script
- Docs: integration, policy schema, error codes, cURL examples

### How it works

- Sites publish a machine-verifiable policy at `/.well-known/agents` describing allowed operations, scopes, rates, and accepted issuers/JWKS.
- Agents send two short-lived JWTs per request:
  - **Agent Identity (ai_jwt)**: who the agent is and who operates it; bound via `cnf.jkt` to the agent’s DPoP key.
  - **Capability/Delegation (cap_jwt)**: what the agent can do, on behalf of which principal; contains scopes and caveats.
- Each HTTP request carries DPoP (proof-of-possession). The site SDK validates tokens and DPoP binding, enforces policy and rate limits, checks revocations, and emits audit events.

### Architecture

- `packages/policy`: Policy schema (Zod), validator, loader with caching, operation matcher
- `packages/credentials`: Claims/types, sign/verify helpers, binding checks
- `packages/dpop`: Create/verify DPoP proofs, JKT computation, replay-cache interface
- `packages/site-sdk`: Core validator (Fetch Request), Express adapter, Worker adapter, rate limiter interface, revocation checker, audit sinks
- `packages/agent-sdk`: Agent key mgmt and `dpopFetch`
- `services/issuer`: Dev issuer (Fastify) for JWKS, token minting, revocations
- `examples/`: API (Express), Worker (Cloudflare), Agent script (Node)

### Quickstart

Requirements: Node 20+, npm 10+ (and `wrangler` for the Worker example).

1) Install deps

```bash
npm i
```

2) Start issuer (port 4000)

```bash
cd services/issuer
npm run dev
```

3) Start API (port 3000)

```bash
cd examples/api
npm run dev
```

4) Run agent (performs allowed GET/POST and a blocked DELETE)

```bash
cd examples/agent
npm start
```

Expected output includes:

```
GET http://localhost:3000/v1/orders/123 200 {"id":"123","status":"ok"}
POST http://localhost:3000/v1/orders 201 {"id":"ord_<random>"}
DELETE http://localhost:3000/v1/orders/123 403 {"error":"operation_not_allowed"}
```

Optional: run the Worker example

```bash
cd examples/worker
npm run dev   # requires: npm i -g wrangler
```

### Policy format

Location: `/.well-known/agents`. Full schema is in `docs/policy.schema.json`. See spec in `docs/POLICY_SPEC.md`.

Minimal example:

```json
{
  "version": "0.1",
  "issuer_metadata": [
    { "issuer": "http://localhost:4000", "jwks_uri": "http://localhost:4000/.well-known/jwks.json" }
  ],
  "supported_auth": ["dpop_jwt"],
  "operations": [
    { "resource": "http://localhost:3000/v1/orders/*", "actions": ["read"], "required_scopes": ["orders:read"] },
    { "resource": "http://localhost:3000/v1/orders", "actions": ["write"], "required_scopes": ["orders:write"] }
  ],
  "rate_limits": [ { "key": "agent+principal", "resource": "http://localhost:3000/v1/orders/*", "limit": { "rpm": 60 } } ],
  "enforcement": { "reject_on_missing_agent_identity": true }
}
```

### Headers and tokens

- HTTP headers per request:
  - **Authorization**: `Bearer <cap_jwt>`
  - **X-Agent-Identity**: `<ai_jwt>`
  - **DPoP**: `<proof>` (RFC 9449)

- Binding:
  - Both JWTs include `cnf.jkt` referencing the agent’s DPoP public key thumbprint.
  - The DPoP proof’s JWK thumbprint must match `cnf.jkt`.

- Lifetimes and audience:
  - `ai_jwt` ≤ 5 minutes, `cap_jwt` ≤ 30 minutes, `aud` = site origin.

### Error codes

See `docs/ERRORS.md` for machine-readable error codes (missing headers, bad auth scheme, insufficient scope, ratelimited, revoked, etc.).

### Roadmap

- BYO IdP and Verifiable Credentials for agent identity/controller attestations
- Redis-backed rate limit and replay caches; S3/Webhook audit sinks
- UCAN-style capabilities and sub-delegation chains
- Conformance tests and reference vectors
- NGINX/Kong plugins; Cloudflare/Akamai apps

### Contributing

- Use Node 20+ and npm 10+.
- Code style: TypeScript, strict mode, small modules, clear naming.
- Open an issue for design changes; keep PRs focused and well-tested.

### License

TBD. If you need a license now, open an issue to discuss MIT/Apache-2.0.


