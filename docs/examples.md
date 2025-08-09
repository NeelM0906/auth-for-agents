## Examples: End‑to‑End Auth Flow and All Responses

This walkthrough shows how to run the issuer, protected API, and agent; then intentionally trigger every response type with minimal code edits and exact expected outputs. Copy–paste friendly and uses absolute paths.

### Prerequisites
- Node 20+
- macOS/Linux shell

From repo root:

```bash
cd /Users/zidane/Desktop/Projects/AA
npm install
```

### Start services (two terminals)
- Terminal A — Issuer (port 4000):
```bash
cd /Users/zidane/Desktop/Projects/AA/services/issuer
npm i
npm run dev
```

- Terminal B — Example API (port 3000):
```bash
cd /Users/zidane/Desktop/Projects/AA/examples/api
npm i
npm run dev
```

The API serves the policy at `http://localhost:3000/.well-known/agents` and mounts agent auth middleware for `/v1/*` routes.

### Baseline: Happy path (allowed + blocked)
Run the agent script in a third terminal:

```bash
cd /Users/zidane/Desktop/Projects/AA/examples/agent
npm i
npm start
```

What it does:
- Generates a DPoP key
- Calls issuer to mint `ai_jwt` and `cap_jwt` bound to that key (via `cnf.jkt`)
- Performs 3 requests with correct headers: `Authorization: Bearer <cap>`, `X-Agent-Identity: <ai>`, `DPoP: <proof>`

Expected output:
- GET http://localhost:3000/v1/orders/123 → `200 {"id":"123","status":"ok"}`
- POST http://localhost:3000/v1/orders → `201 {"id":"ord_<random>"}`
- DELETE http://localhost:3000/v1/orders/123 → `403 {"error":"operation_not_allowed"}`

That confirms end‑to‑end auth: tokens verify, DPoP binds, policy matches, scopes checked; DELETE is blocked by policy.

---

## Targeted scenarios: Trigger each response
Edits are minimal and local to the example scripts. After each change, rerun `npm start` in `examples/agent` (and restart API if noted). Use the small diffs below; do not reformat unrelated code.

Files referenced:
- Agent: `/Users/zidane/Desktop/Projects/AA/examples/agent/src/run.ts`
- API: `/Users/zidane/Desktop/Projects/AA/examples/api/src/server.ts`

You can restore a file anytime:
```bash
git checkout -- /Users/zidane/Desktop/Projects/AA/examples/agent/src/run.ts
git checkout -- /Users/zidane/Desktop/Projects/AA/examples/api/src/server.ts
```

### 1) missing_headers (401)
Remove `X-Agent-Identity` so the validator detects missing required headers.

Edit `/examples/agent/src/run.ts` inside `call(...)` headers:

```ts
// before
headers: {
  Authorization: `Bearer ${cap}`,
  'X-Agent-Identity': ai,
  DPoP: dpop,
  'Content-Type': 'application/json'
}

// after (remove X-Agent-Identity)
headers: {
  Authorization: `Bearer ${cap}`,
  DPoP: dpop,
  'Content-Type': 'application/json'
}
```

Expected for any call: `401 {"error":"missing_headers"}`

### 2) bad_auth_scheme (401)
Send an invalid `Authorization` scheme while keeping all headers present.

Edit `/examples/agent/src/run.ts` inside `call(...)` headers:

```ts
// before
Authorization: `Bearer ${cap}`

// after
Authorization: `Basic ${cap}`
```

Expected: `401 {"error":"bad_auth_scheme"}`

### 3) operation_not_allowed (403)
This already appears in baseline for `DELETE /v1/orders/123`. Another way: request a path not covered by policy.

Edit `/examples/agent/src/run.ts` in `main()` and add:

```ts
await call(apiBase + '/v1/secret', 'GET', ai, cap, dpopJwk as any);
```

Expected: `403 {"error":"operation_not_allowed"}`

### 4) insufficient_scope (403)
Mint a delegation without write scope, then attempt POST.

Edit cap token request body in `/examples/agent/src/run.ts`:

```ts
// before
body: JSON.stringify({ principal: 'org:demo', aud: apiBase, jkt, scopes: ['orders:read', 'orders:write'] })

// after (remove write)
body: JSON.stringify({ principal: 'org:demo', aud: apiBase, jkt, scopes: ['orders:read'] })
```

Keep the POST call to `/v1/orders`.

Expected: `403 {"error":"insufficient_scope"}`

### 5) binding_mismatch (403)
Use a different DPoP key for the proof than the one bound in tokens.

Edit `/examples/agent/src/run.ts` in `main()` and `call(...)`:

```ts
// after computing dpopJwk in main()
const { privateKey: otherPriv } = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
const otherJwk = await exportJWK(otherPriv);

// in call(...), use otherJwk to create the proof
const dpop = await createDpopProof(otherJwk as any, { htm: method, htu: url });
```

Expected: `403 {"error":"binding_mismatch","detail":"dpop_jkt_mismatch"}`

### 6) token_invalid (issuer not accepted) (401)
Make the API reject the issuer used to sign tokens.

Edit `/examples/api/src/server.ts` in the middleware options:

```ts
// before
acceptedIssuers: ['http://localhost:4000'],

// after (wrong issuer)
acceptedIssuers: ['http://localhost:9999'],
```

Restart the API, run agent.

Expected: `401 {"error":"token_invalid","detail":"unaccepted_issuer"}`

### 7) audience mismatch (currently mapped as internal_error → 500)
Mint a cap with an `aud` different from the API origin.

Edit cap token request body in `/examples/agent/src/run.ts`:

```ts
// before
aud: apiBase

// after
aud: 'http://localhost:9999'
```

Expected (current behavior): `500 {"error":"internal_error","detail":"...audience..."}`

Note: Validator can be extended to translate this into `401 token_invalid`.

### 8) ratelimited (403)
Spam over the configured RPM for the same key/path.

Edit `/examples/agent/src/run.ts` end of `main()`:

```ts
for (let i = 0; i < 65; i++) {
  await call(apiBase + '/v1/orders/123', 'GET', ai, cap, dpopJwk as any);
}
```

Expected: first ~60 calls `200`, then `403 {"error":"ratelimited"}` on overage.

### 9) revoked (403)
Enable revocation checking in the API, revoke the cap `jti`, then call again.

Step A — Edit `/examples/api/src/server.ts` to add HTTP revocation checker:

```ts
// add import near top
import { HttpRevocations } from '@auth4agents/site-sdk/src/revocation-http';

// in agentAuthMiddleware options
revocations: new HttpRevocations('http://localhost:4000/revocations'),
```

Restart the API.

Step B — Edit `/examples/agent/src/run.ts` to capture `jti`, revoke it, then perform a call:

```ts
// after cap fetch
const capJson = await capRes.json();
const cap = capJson.token as string;
const capJti = capJson.jti as string;

// revoke immediately
await fetch(issuerBase + '/revoke', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ jti: capJti })
});

// now any call with this cap should be rejected
await call(apiBase + '/v1/orders/123', 'GET', ai, cap, dpopJwk as any);
```

Expected: `403 {"error":"revoked"}`

### 10) dpop_invalid (currently mapped as internal_error → 500)
Lie about the HTTP method in the DPoP proof.

Edit `/examples/agent/src/run.ts` inside `call(...)`:

```ts
// before
const dpop = await createDpopProof(dpopKey, { htm: method, htu: url });

// after (force wrong method in proof)
const dpop = await createDpopProof(dpopKey, { htm: 'GET', htu: url });
```

Then issue a POST.

Expected (current behavior): `500 {"error":"internal_error","detail":"dpop_method_mismatch"}`

---

## Reference: What the validator checks
- Headers present and `Authorization` scheme is Bearer
- Load policy from `policyUrl`, match operation by origin + path pattern + method
- Verify `ai_jwt` and `cap_jwt` against accepted issuers and audience
- Enforce DPoP proof and JKT binding to tokens (`cnf.jkt`)
- Required scopes present in `cap.att[*].scopes`
- Optional: revocation check
- Optional: rate limiting per policy

See `packages/site-sdk/src/index.ts` for the exact order and error mapping.


