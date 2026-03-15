// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER';
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
  userId?: string;
  tenantId?: string;
  role?: JwtPayload['role'];
}

export const authMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const authReq = req as AuthRequest;
    authReq.user = payload;
    authReq.userId = payload.userId;
    authReq.tenantId = payload.tenantId;
    authReq.role = payload.role;

    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
