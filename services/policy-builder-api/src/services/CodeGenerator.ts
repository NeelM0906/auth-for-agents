import type { Policy } from '@auth4agents/policy';

export type GeneratedFile = { path: string; content: string };
export type GeneratedCode = { files: GeneratedFile[]; installCommands: string[]; integrationCode: string };

export class CodeGenerator {
  async forPlatform(platform: 'express' | 'cloudflare' | 'nginx' | 'wordpress', policy: Policy): Promise<GeneratedCode> {
    switch (platform) {
      case 'express': {
        try {
          const mod: any = await import('@auth4agents/integration-service/generators/ExpressGenerator.js');
          return new mod.ExpressGenerator().generateMiddleware(policy);
        } catch {
          const modUrl = new URL('../../../integration-service/dist/generators/ExpressGenerator.js', import.meta.url).href;
          const mod: any = await import(modUrl);
          return new mod.ExpressGenerator().generateMiddleware(policy);
        }
      }
      case 'cloudflare': {
        try {
          const mod: any = await import('@auth4agents/integration-service/generators/CloudflareWorkerGenerator.js');
          return new mod.CloudflareWorkerGenerator().generateMiddleware(policy);
        } catch {
          const modUrl = new URL('../../../integration-service/dist/generators/CloudflareWorkerGenerator.js', import.meta.url).href;
          const mod: any = await import(modUrl);
          return new mod.CloudflareWorkerGenerator().generateMiddleware(policy);
        }
      }
      case 'nginx': {
        try {
          const mod: any = await import('@auth4agents/integration-service/generators/NginxGenerator.js');
          return new mod.NginxGenerator().generateMiddleware(policy);
        } catch {
          const modUrl = new URL('../../../integration-service/dist/generators/NginxGenerator.js', import.meta.url).href;
          const mod: any = await import(modUrl);
          return new mod.NginxGenerator().generateMiddleware(policy);
        }
      }
      case 'wordpress': {
        try {
          const mod: any = await import('@auth4agents/integration-service/generators/WordPressGenerator.js');
          return new mod.WordPressGenerator().generateMiddleware(policy);
        } catch {
          const modUrl = new URL('../../../integration-service/dist/generators/WordPressGenerator.js', import.meta.url).href;
          const mod: any = await import(modUrl);
          return new mod.WordPressGenerator().generateMiddleware(policy);
        }
      }
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}
