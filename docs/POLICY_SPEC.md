## Policy v0.1 Specification

Location: `/.well-known/agents`

Fields:
- version: "0.1"
- issuer_metadata[]: { issuer, jwks_uri }
- supported_auth[]: currently ["dpop_jwt"]
- operations[]: { resource, actions[], required_scopes[] }
- rate_limits[]: { key: "agent"|"principal"|"agent+principal", resource, limit: { rpm?, rph? } }
- pricing?: { unit, amount_usd }
- contact?: string (email or URL)
- enforcement: { reject_on_missing_agent_identity }

Matching rules:
- resource must match origin and path (supports `*` for one segment, `**` for remainder)
- actions map to HTTP methods: GET→read/list, POST→write/execute, PUT/PATCH→write, DELETE→delete
- required_scopes must be present in at least one `att` block of `cap_jwt`

Security considerations:
- Audience-binding required (aud = site origin)
- Short TTLs recommended: ai_jwt ≤ 5m, cap_jwt ≤ 30m
- DPoP required; `cnf.jkt` must match DPoP JKT

See `docs/policy.schema.json` for JSON schema.


