import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { validateRequest, type ValidatorOptions } from './index';

export function agentAuthMiddleware(opts: ValidatorOptions) {
  return async function (req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
    const result = await validateRequest(new Request(req.protocol + '://' + req.get('host') + req.originalUrl, {
      method: req.method,
      headers: req.headers as any,
      body: ['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify((req as any).body)
    }), opts);
    if (!result.allowed) return res.status(result.status).json(result.error as any);
    (res.locals as any).agent = result.context;
    next();
  };
}


