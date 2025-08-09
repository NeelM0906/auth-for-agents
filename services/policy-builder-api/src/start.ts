import app from './server.js';

const port = process.env.POLICY_BUILDER_API_PORT ? Number(process.env.POLICY_BUILDER_API_PORT) : 4005;
app.listen(port, () => console.log(`[policy-builder-api] listening on :${port}`));
