// src/middleware/permissionMiddleware.ts
import { Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from './authMiddleware';
import { USER_PERMISSIONS, PermissionKey } from '../constants/permissions';

export const requirePermission = (permission: PermissionKey): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rolePermissions = USER_PERMISSIONS[req.user.role] || [];

    if (!rolePermissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
};

