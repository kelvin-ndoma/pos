// src/middleware/auditMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { auditService } from '../services/auditService';
import { AuthRequest } from './authMiddleware';
import { TenantRequest } from './tenantMiddleware';
import { logger } from '../config/logger';

export const auditMiddleware = (
  action: string,
  entity: string,
): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Let the controller run first, then log in a finally-like way
    // so we don't block the main flow on audit errors.
    // We achieve this by wrapping next() and logging after response is sent.

    // Attach a listener to log after response finishes
    const res = _res;
    res.on('finish', async () => {
      try {
        const authReq = req as AuthRequest;
        const tenantReq = req as TenantRequest;

        const tenantId = tenantReq.tenantId;
        if (!tenantId) return;

        const userId = authReq.user?.userId;
        const entityId =
          (req.params && (req.params.id as string)) ||
          (res.locals && (res.locals.entityId as string));

        await auditService.log(tenantId, {
          userId,
          action,
          entity,
          entityId,
          metadata: {
            method: req.method,
            path: req.originalUrl,
            body: req.body,
            query: req.query,
          },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (error) {
        logger.error('Audit middleware error', { error });
      }
    });

    return next();
  };
};
