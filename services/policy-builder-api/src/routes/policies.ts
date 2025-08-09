import { Router } from 'express';
import { z } from 'zod';
import { PolicyGenerator } from '../services/PolicyGenerator.js';
import { validatePolicy } from '@auth4agents/policy';
import { CodeGenerator } from '../services/CodeGenerator.js';
import { BuilderConfigSchema } from '../models/Policy.js';

const router = Router();

// Use shared schema from models

router.post('/generate', async (req, res) => {
  const parsed = BuilderConfigSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const cfg = parsed.data as any;
  if (cfg?.rateLimits?.[0]?.rpm && cfg.rateLimits[0].rpm > 600) cfg.rateLimits[0].rpm = 600;

  const policy = new PolicyGenerator().generatePolicy(cfg);
  try {
    const validated = validatePolicy(policy);
    res.json(validated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/generate-code', async (req, res) => {
  const schema = z.object({ platform: z.enum(['express','cloudflare','nginx','wordpress']), builderConfig: BuilderConfigSchema });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const cfg = parsed.data.builderConfig;
  if (cfg?.rateLimits?.[0]?.rpm && cfg.rateLimits[0].rpm > 600) cfg.rateLimits[0].rpm = 600;
  const policy = new PolicyGenerator().generatePolicy(cfg);
  try {
    const validated = validatePolicy(policy);
    const gen = await new CodeGenerator().forPlatform(parsed.data.platform, validated);
    res.json(gen);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
