import type { Policy } from '@auth4agents/policy';
import { PlatformGenerator, type GeneratedCode } from './PlatformGenerator.js';

export class NginxGenerator extends PlatformGenerator {
  generateMiddleware(policy: Policy): GeneratedCode {
    const conf = `
location / {
  # Example: block known scrapers via user-agent (placeholder)
  if ($http_user_agent ~* "(Scrapy|HttpClient|PriceBot)") { return 403; }
}

location = /.well-known/agents {
  default_type application/json;
  return 200 '${JSON.stringify(policy).replace(/'/g, "'\\''")}';
}
`;
    return {
      files: [ { path: 'nginx/agents.conf', content: conf } ],
      installCommands: [],
      integrationCode: 'include nginx/agents.conf;'
    };
  }
  generateDeploymentInstructions() { return { steps: ['Copy conf to server', 'Reload nginx'] }; }
  validateConfiguration() { return { ok: true }; }
}


