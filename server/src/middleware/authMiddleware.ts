// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../utils/jwt';

export type PlatformRole =
  | 'PLATFORM_OWNER'
  | 'PLATFORM_ADMIN'
  | 'PLATFORM_SUPPORT'
  | 'NONE';

export type TenantRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER';

export interface AuthRequest extends Request {
  user?: JwtPayload;
  userId?: string;
  tenantId?: string;
  role?: TenantRole;
  platformRole?: PlatformRole;
}

export const authMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const authReq = req as AuthRequest;

    // base values from token
    authReq.user = payload;
    authReq.userId = payload.userId;
    authReq.tenantId = payload.tenantId;
    authReq.role = payload.role;
    authReq.platformRole = payload.platformRole ?? 'NONE';

    // allow platform owners/admins to override tenant via header
    if (
      authReq.platformRole === 'PLATFORM_OWNER' ||
      authReq.platformRole === 'PLATFORM_ADMIN'
    ) {
      const overrideTenantId = req.header('x-tenant-id');
      if (overrideTenantId) {
        authReq.tenantId = overrideTenantId;
      }
    }

    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
