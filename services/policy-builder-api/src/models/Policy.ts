import { z } from 'zod';

export const PermissionSchema = z.enum(['allow','block','rate-limited','require-auth']);

export const BuilderConfigSchema = z.object({
  origin: z.string().url().optional(),
  resources: z.array(z.object({ pattern: z.string(), description: z.string().optional() })).optional(),
  permissions: z.array(z.object({ resource: z.string(), agentType: z.string(), permission: PermissionSchema })).optional(),
  rateLimits: z.array(z.object({ scope: z.enum(['agent','principal','agent+principal']), rpm: z.number().int().positive().optional(), rph: z.number().int().positive().optional() })).optional(),
  trustedIssuers: z.array(z.string().url()).optional(),
  strictness: z.enum(['lenient','strict']).optional()
});

export type BuilderConfig = z.infer<typeof BuilderConfigSchema>;
