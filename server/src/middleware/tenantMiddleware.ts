// src/middleware/tenantMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from './authMiddleware';
import { Tenant } from '../models';
import { logger } from '../config/logger';

export interface TenantRequest extends AuthRequest {
  tenantId: string;
  // user is already on AuthRequest: { userId, tenantId, role }
}

export const tenantMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthRequest;
    let tenantId = authReq.user?.tenantId;

    const headerTenantId = req.header('X-Tenant-Id');
    if (headerTenantId && typeof headerTenantId === 'string') {
      tenantId = headerTenantId;
    }

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant not specified' });
    }

    const tenant = await Tenant.findById(tenantId).select('_id isActive');
    if (!tenant || !tenant.isActive) {
      return res.status(403).json({ error: 'Tenant disabled or not found' });
    }

    (req as TenantRequest).tenantId = tenant.id;

    return next();
  } catch (error) {
    logger.error('Tenant middleware error', { error });
    return res.status(500).json({ error: 'Tenant resolution failed' });
  }
};
