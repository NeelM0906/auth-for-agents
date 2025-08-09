import type { Policy } from '@auth4agents/policy';

export class PolicyGenerator {
  generatePolicy(builderConfig: any): Policy {
    const origin = builderConfig?.origin || 'https://example.com';
    const resources: Array<{ pattern: string }> = builderConfig?.resources || [{ pattern: '/**' }];
    const rpm = builderConfig?.rateLimits?.[0]?.rpm ?? 600;

    const operations = resources.map((r: any) => ({
      resource: new URL(r.pattern, origin).toString(),
      actions: ['read'],
      required_scopes: ['content:read']
    }));

    return {
      version: '0.1',
      issuer_metadata: [{ issuer: 'https://issuer.example.com', jwks_uri: 'https://issuer.example.com/.well-known/jwks.json' }],
      supported_auth: ['dpop_jwt'],
      operations,
      rate_limits: [
        { key: 'agent+principal', resource: new URL('/**', origin).toString(), limit: { rpm } }
      ],
      enforcement: { reject_on_missing_agent_identity: true }
    } as Policy;
  }
}
