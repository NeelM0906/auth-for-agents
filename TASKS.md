## Auth for Agents — MVP Task List

Legend: [ ] todo, [~] in progress, [x] done

### 0. Repo scaffolding
- [x] Create monorepo structure (`packages/`, `services/`, `examples/`, `docs/`)
- [x] Root config files (`package.json` workspaces, `tsconfig.base.json`, `.gitignore`)
- [ ] CI placeholder (GH Actions workflow stub)

### 1. Site Policy Discovery (/.well-known/agents)
- [x] Define Policy v0.1 TypeScript types (policy version, issuers, operations, rate limits, enforcement flags)
- [x] Implement policy validator (strict checks, friendly errors)
- [x] Implement operation matcher (maps request method+URL → operation and required scopes)
- [x] Provide example policy JSON (`examples/policies/example-agents.json`)
- [x] Provide policy loader with caching interface (in-memory, fetch helper)
- [ ] Add JSON Schema (derived from TS types) and publish to `docs/`
  - [x] Add JSON Schema (derived from TS types) and publish to `docs/`

Acceptance criteria:
- Loading an example JSON returns a validated Policy object.
- Matching `GET /v1/orders/123` resolves to an op with `orders:read`.

### 2. Credentials: Agent Identity (ai_jwt) and Capability (cap_jwt)
- [x] Define claims and TS types for both JWTs
- [x] Implement encode/decode helpers (JOSE), enforce audience/exp/iat/nbf
- [x] Implement cnf.jkt binding and cross-token binding check (ai <-> cap)
- [ ] Provide example vectors (valid/invalid) for unit tests

Acceptance criteria:
- Valid tokens verify against issuer JWKS and audience.
- Binding checks fail when cnf.jkt differs.

### 3. DPoP (Proof-of-Possession)
- [x] Agent-side: key generation and DPoP header creation (RFC 9449)
- [x] Server-side: verify DPoP (htu/htm/iat/jti replay cache)
- [x] JKT computation and comparison with cnf.jkt

Acceptance criteria:
- DPoP verification rejects mismatched method/URL and replayed jti.

### 4. Site-side Enforcement Middleware
- [x] Express middleware (Node):
  - validate headers (ai, cap, dpop)
  - JOSE verification against remote JWKS
  - policy match + scope check
  - DPoP verification + binding
  - rate limiting adapter interface (memory/Redis stubs)
  - structured error responses
- [x] Cloudflare Worker validator:
  - same semantics using WebCrypto

Acceptance criteria:
- Requests with valid headers pass; missing scope or bad DPoP yields 403 with machine-readable error.

### 5. Issuer service (control-plane, MVP)
- [x] Endpoints:
  - `POST /register-agent` (one-time, returns software_id and issuer-sub)
  - `POST /token/agent-identity` (short-lived ai_jwt)
  - `POST /token/delegation` (after OIDC consent; returns cap_jwt)
  - `GET /.well-known/jwks.json`
  - `GET /revocations` (list by jti/kid)
- [x] In-memory storage (keys, registrations, revocations)
- [x] Pluggable signer (ed25519/p256)

Acceptance criteria:
- Can mint both tokens and rotate signing keys without breaking verification.

### 6. Revocation
- [x] Data model (revoked jti, kid with reason/time)
- [x] Server: add to list and expose via ETag + max-age
- [x] Client: LRU cache + background refresh; TTL-bound

Acceptance criteria:
- Revoked jti is denied within 30s without waiting for token expiry.

### 7. Audit Logging
- [x] Define audit event schema (minimal, privacy-preserving)
- [ ] Local append-only log with hash-chained entries (JWS-signed)
- [ ] Pluggable sink (file/S3/Webhook; implement file only for MVP)

Acceptance criteria:
- Each enforcement decision produces a signed log entry; hash chain validates.

### 8. SDKs
- [x] Agent SDK (Node): key mgmt, ai_jwt fetch, cap_jwt exchange, `dpopFetch`
- [x] Site SDK: export middleware + worker validator; typed context on success

Acceptance criteria:
- Agent sample can call example API with one function (`dpopFetch`) and succeed.

### 9. Demo / Examples
- [x] Example API (Express) that mounts middleware and exposes two endpoints with scopes
- [x] Example Agent script that obtains tokens and calls API (allowed/blocked demo)
- [x] cURL docs for manual testing

Acceptance criteria:
- Running the example shows allowed and blocked requests with clear errors.

### 10. Docs
- [x] Policy spec doc (v0.1) with fields and semantics
- [x] Integration guide (site) and (agent)
- [x] Error codes and troubleshooting

### 11. Tooling & QA
- [x] ESLint + Prettier config (sane defaults)
- [x] Type-check + build scripts
- [x] Minimal unit tests (policy validator, DPoP verifier)

---

### Execution log
- 2025-08-09: Added TASKS.md with full MVP plan, acceptance criteria, and dependencies.
- 2025-08-09: Scaffolding done. Implemented `@auth4agents/policy` (types, validator, matcher, URL loader cache). Added example policy JSON.
- 2025-08-09: Implemented Robots Builder skeleton (frontend app, API, integration generators). Added docs: ROBOTS_BUILDER.md, POLICY_BUILDER_API.md, INTEGRATION_SERVICE_API.md. Updated INTEGRATION.md links.


### 12. Robots.txt Builder (Visual Policy + Code/Deploy)
- [~] Frontend (Next.js app: visual builder, dashboard, deploy)
  - [x] Components: `PolicyBuilder/*` (ResourceSelector, AgentTypeSelector, PermissionMatrix [stub], RateLimitConfig, PolicyPreview)
  - [x] Pages: `builder`, `dashboard`, `deploy`
  - [x] Lib: `policyGenerator`, `codeGenerator`, `templateLibrary`
  - [x] State mgmt (Zustand) + real-time validation (debounced)
  - [ ] Basic analytics hooks (PostHog/Mixpanel stub)
- [~] Backend API (`services/policy-builder-api`)
  - [x] Routes: `policies`, `templates`, `deployment`, `analytics`
  - [x] Services: `PolicyGenerator`, `CodeGenerator`, `TemplateManager`, `DeploymentService` [stub]
  - [x] Models: `Policy`, `Template`, `User` (TS types only; in-memory store)
  - [ ] AuthN stub (API key) + input validation (Zod) [input validation done]
- [~] Integration Service (`services/integration-service`)
  - [x] Generators: Express, Cloudflare Worker, Nginx, WordPress
  - [ ] Deployers: GitHub PR, Netlify, Vercel (stubs) [Vercel stub done]
  - [x] Code sanitizer + template rendering (sanitizer done)
- [~] Testing & Validation
  - [x] `@auth4agents/policy-tester`: simulate requests vs policy; include standard test cases
  - [ ] E2E: Playwright flow for builder → preview → generate → download
- [x] Docs
  - [x] Add Robots.txt Builder guide to `docs/`
  - [x] API docs for policy-builder-api + integration-service

Acceptance criteria:
- Visual builder produces a valid policy JSON that passes validator and standard tests.
- Code generation returns platform-specific middleware scaffold using `@auth4agents/site-sdk`.
- One-click deploy to Vercel produces a preview URL with `.well-known/agents` served.
- Example: E-commerce template leads to sensible defaults (allow search, block scrapers, rate-limit assistants).

Dependencies:
- Reuse `@auth4agents/policy` for schema/validation; `@auth4agents/site-sdk` for middleware integration.
- Add Next.js/React, Express, Zod, and minimal client libs.


