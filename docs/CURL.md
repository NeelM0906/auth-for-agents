## cURL testing (dev)

1) Start issuer (port 4000) and API (port 3000). Obtain tokens via issuer:

```bash
curl -s http://localhost:4000/.well-known/jwks.json | jq
```

2) Mint ai_jwt:
```bash
JKT="your_jkt_here"
curl -s -X POST http://localhost:4000/token/agent-identity -H 'content-type: application/json' \
  -d "{\"sub\":\"did:key:demo\",\"aud\":\"http://localhost:3000\",\"cnf\":{\"jkt\":\"$JKT\"}}"
```

3) Mint cap_jwt:
```bash
curl -s -X POST http://localhost:4000/token/delegation -H 'content-type: application/json' \
  -d '{"principal":"org:demo","aud":"http://localhost:3000","jkt":"'$JKT'","scopes":["orders:read","orders:write"]}'
```

Use DPoP library to create the `DPoP` header and call the API.


