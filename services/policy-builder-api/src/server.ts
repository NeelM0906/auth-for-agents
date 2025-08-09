import express from 'express';
import { json } from 'express';
import policiesRouter from './routes/policies.js';
import templatesRouter from './routes/templates.js';
import deploymentRouter from './routes/deployment.js';
import analyticsRouter from './routes/analytics.js';

const app = express();
app.use(json());

app.use('/policies', policiesRouter);
app.use('/templates', templatesRouter);
app.use('/deployment', deploymentRouter);
app.use('/analytics', analyticsRouter);

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? Number(process.env.PORT) : 4005;
  app.listen(port, () => console.log(`[policy-builder-api] listening on :${port}`));
}

export default app;
