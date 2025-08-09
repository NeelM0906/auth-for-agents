import { Router } from 'express';
import { DeploymentService } from '../services/DeploymentService.js';

const router = Router();

router.post('/vercel', async (req, res) => {
  try {
    const result = await new DeploymentService().deployToVercel(req.body.policy, req.body.config);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
