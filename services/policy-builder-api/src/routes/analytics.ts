import { Router } from 'express';

const router = Router();

router.post('/events', (req, res) => {
  // accept analytics events, no-op for now
  res.status(204).end();
});

export default router;
