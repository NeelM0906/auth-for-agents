## Integration Service API (Generators & Deployers)

This document describes the interfaces provided by the integration service.

### Generators

Common types:
```
type GeneratedFile = { path: string; content: string };
type GeneratedCode = { files: GeneratedFile[]; installCommands: string[]; integrationCode: string };
```

#### ExpressGenerator
Outputs:
- `middleware/auth-for-agents.js` (middleware using `@auth4agents/site-sdk`)
- `public/.well-known/agents` (policy JSON)

#### CloudflareWorkerGenerator
Outputs:
- `worker.js` (Worker entry that validates requests)
- `public/.well-known/agents`

#### NginxGenerator
Outputs:
- `nginx/agents.conf` (serves policy and example UA gates)

#### WordPressGenerator
Outputs:
- `wp-plugin/auth-for-agents` (simple plugin serving policy)

All generators implement:
```
abstract class PlatformGenerator {
  abstract generateMiddleware(policy: Policy): GeneratedCode;
  abstract generateDeploymentInstructions(): { steps: string[] };
  abstract validateConfiguration(config: any): { ok: boolean; errors?: string[] };
}
```

### Deployers

#### VercelDeployer (stub)
```
type VercelConfig = { token: string; projectId: string };
type DeployResult = { url: string; status: 'created' | 'failed' };
```
Currently returns a fake preview URL. To be replaced with real GitHub PR + Vercel deployment flow.

### Security
- Generators must sanitize user-provided values via `CodeSanitizer.sanitizeConfigValue` before interpolation.


