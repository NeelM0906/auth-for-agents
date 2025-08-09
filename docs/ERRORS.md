## Error codes

- missing_headers: Some of Authorization, X-Agent-Identity, DPoP are missing
- bad_auth_scheme: Authorization is not Bearer
- policy_not_found: Policy unavailable
- operation_not_allowed: No matching operation in policy
- token_invalid: Token failed verification or issuer not accepted
- dpop_invalid: DPoP proof invalid
- binding_mismatch: ai.cnf.jkt != cap.cnf.jkt or DPoP jkt mismatch
- insufficient_scope: Required scopes not present in cap
- ratelimited: Exceeded rate limits
- revoked: Token jti revoked
- internal_error: Unexpected failure

