import type { Policy } from '@auth4agents/policy';

export type GeneratedFile = { path: string; content: string };
export type GeneratedCode = { files: GeneratedFile[]; installCommands: string[]; integrationCode: string };
export type DeploymentGuide = { steps: string[] };
export type ValidationResult = { ok: boolean; errors?: string[] };

export abstract class PlatformGenerator {
  abstract generateMiddleware(policy: Policy): GeneratedCode;
  abstract generateDeploymentInstructions(): DeploymentGuide;
  abstract validateConfiguration(config: any): ValidationResult;
}
