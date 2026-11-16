// src/middleware/permissionMiddleware.ts
import { Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from './authMiddleware';
import { TenantRequest } from './tenantMiddleware';
import {
  PermissionKey,
  PLATFORM_ROLE_PERMISSIONS,
  TENANT_ROLE_PERMISSIONS,
} from '../constants/permissions';

function isPlatformRoute(req: AuthRequest): boolean {
  const path = req.originalUrl || req.path || '';
  return path.includes('/platform') || path.includes('/admin');
}

export const requirePermission = (
  permission: PermissionKey,
): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (isPlatformRoute(req)) {
      const platformRole = req.platformRole ?? 'NONE';
      const platformPerms =
        PLATFORM_ROLE_PERMISSIONS[platformRole] || [];

      if (!platformPerms.includes(permission)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return next();
    }

    const tReq = req as TenantRequest;

    // Prefer roles resolved for the active tenant (supports multi-business membership)
    if (tReq.tenantPermissions?.length) {
      if (tReq.tenantPermissions.includes(permission)) {
        return next();
      }
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fallback for routes without tenantMiddleware
    const tenantRole = req.role;
    if (!tenantRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const tenantPerms = TENANT_ROLE_PERMISSIONS[tenantRole] || [];

    if (!tenantPerms.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
};
