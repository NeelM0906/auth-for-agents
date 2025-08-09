export type ResourcePattern = { pattern: string; description?: string };
export type PolicyTemplate = { resource: string; allowedAgents?: string[]; blockedAgents?: string[]; rateLimit?: { rpm?: number; rph?: number } };

export type SiteTemplate = {
  id: string;
  name: string;
  description: string;
  commonResources: ResourcePattern[];
  recommendedPolicies: PolicyTemplate[];
  riskProfile: 'low' | 'medium' | 'high';
};
