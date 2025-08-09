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

export const templates: SiteTemplate[] = [
  {
    id: 'ecommerce',
    name: 'E-commerce Store',
    description: 'Online store with product catalog and pricing',
    commonResources: [
      { pattern: '/products/*', description: 'Product pages' },
      { pattern: '/api/prices/*', description: 'Pricing API' },
      { pattern: '/search*', description: 'Search functionality' }
    ],
    recommendedPolicies: [
      { resource: '/products/*', allowedAgents: ['googlebot', 'bingbot'], blockedAgents: ['aggressive-scrapers'], rateLimit: { rpm: 30 } }
    ],
    riskProfile: 'high'
  }
];


