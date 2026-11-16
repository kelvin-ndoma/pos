// src/middleware/roleMiddleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { TenantRequest } from './tenantMiddleware';
import { TenantRole } from '../constants/permissions';

// Require at least one of the given tenant roles in the current tenant
export const requireRole =
  (roles: TenantRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tReq = req as TenantRequest;
    const tenantRoles = tReq.tenantRoles || [];

    const hasRole = tenantRoles.some((r) => roles.includes(r));

    if (!hasRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
