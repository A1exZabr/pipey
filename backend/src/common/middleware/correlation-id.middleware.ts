import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  orgId?: string;
  userId?: string;
}

export const requestStore = new AsyncLocalStorage<RequestContext>();

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const user = (req as any).user;
    const store: RequestContext = {
      requestId,
      orgId: user?.orgId,
      userId: user?.userId,
    };

    requestStore.run(store, () => next());
  }
}
