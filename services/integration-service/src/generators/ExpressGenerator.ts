import type { Policy } from '@auth4agents/policy';
import { PlatformGenerator, type GeneratedCode } from './PlatformGenerator.js';

export class ExpressGenerator extends PlatformGenerator {
  generateMiddleware(policy: Policy): GeneratedCode {
    const middleware = `
import { agentAuthMiddleware, InMemoryRateLimiter } from '@auth4agents/site-sdk';

const rateLimiter = new InMemoryRateLimiter();

export const authMiddleware = agentAuthMiddleware({
  policyUrl: '${new URL('/.well-known/agents', 'https://example.com').toString()}',
  acceptedIssuers: ${JSON.stringify(policy.issuer_metadata.map(i => i.issuer))},
  rateLimiter,
});
`; 

    return {
      files: [
        { path: 'middleware/auth-for-agents.js', content: middleware },
        { path: 'public/.well-known/agents', content: JSON.stringify(policy, null, 2) }
      ],
      installCommands: ['npm install @auth4agents/site-sdk'],
      integrationCode: "app.use('/api', authMiddleware);"
    };
  }

  generateDeploymentInstructions() {
    return { steps: ['Copy files into your Express app', 'Install deps', 'Restart server'] };
  }

  validateConfiguration(_config: any) {
    return { ok: true };
  }
}
