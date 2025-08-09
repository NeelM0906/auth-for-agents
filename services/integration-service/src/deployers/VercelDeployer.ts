export type VercelConfig = { token: string; projectId: string };
export type DeployResult = { url: string; status: 'created' | 'failed' };

export class VercelDeployer {
  async deploy(_files: Array<{ path: string; content: string }>, _config: VercelConfig): Promise<DeployResult> {
    // Stub: return fake deployment
    return { url: 'https://vercel-preview.example.com', status: 'created' };
  }
}
