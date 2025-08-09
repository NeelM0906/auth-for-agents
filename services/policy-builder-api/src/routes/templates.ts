import { Router } from 'express';
import { TemplateManager } from '../services/TemplateManager.js';

const router = Router();

router.get('/', (_req, res) => {
  const templates = new TemplateManager().listTemplates();
  res.json(templates);
});

export default router;
