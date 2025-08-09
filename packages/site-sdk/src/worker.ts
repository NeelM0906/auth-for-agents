import { validateRequest, type ValidatorOptions } from './index';

export async function validateAgent(req: Request, opts: ValidatorOptions): Promise<{ allowed: boolean; status?: number; error?: unknown; context?: any }> {
  const result = await validateRequest(req, opts);
  if (!result.allowed) return { allowed: false, status: result.status, error: result.error };
  return { allowed: true, context: result.context };
}


