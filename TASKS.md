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


