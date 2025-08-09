export type SiteTemplate = {
  id: string;
  name: string;
  description: string;
  commonResources: Array<{ pattern: string; description?: string }>;
  recommendedPolicies: Array<any>;
  riskProfile: 'low' | 'medium' | 'high';
};

const templates: SiteTemplate[] = [
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
      {
        resource: '/products/*',
        allowedAgents: ['googlebot', 'bingbot', 'price-comparison-verified'],
        blockedAgents: ['aggressive-scrapers'],
        rateLimit: { rpm: 30 }
      }
    ],
    riskProfile: 'high'
  }
];

export class TemplateManager {
  listTemplates() { return templates; }
}
