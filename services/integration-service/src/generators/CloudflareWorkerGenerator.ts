import type { Policy } from '@auth4agents/policy';
import { PlatformGenerator, type GeneratedCode } from './PlatformGenerator.js';

export class CloudflareWorkerGenerator extends PlatformGenerator {
  generateMiddleware(policy: Policy): GeneratedCode {
    const worker = `
import { validateRequest } from '@auth4agents/site-sdk';

export default {
  async fetch(req) {
    const result = await validateRequest(req, {
      policyUrl: new URL('/.well-known/agents', 'https://example.com').toString(),
      acceptedIssuers: ${JSON.stringify(policy.issuer_metadata.map(i => i.issuer))},
      rateLimiter: { check: async () => ({ allowed: true }) },
    });
    if (!result.allowed) return new Response(JSON.stringify(result.error), { status: result.status, headers: { 'content-type': 'application/json' } });
    return new Response('ok');
  }
};
`;

    return {
      files: [
        { path: 'worker.js', content: worker },
        { path: 'public/.well-known/agents', content: JSON.stringify(policy, null, 2) }
      ],
      installCommands: ['npm install @auth4agents/site-sdk'],
      integrationCode: 'wrangler dev'
    };
  }

  generateDeploymentInstructions() { return { steps: ['Add wrangler.toml', 'Deploy via wrangler'] }; }
  validateConfiguration() { return { ok: true }; }
}


