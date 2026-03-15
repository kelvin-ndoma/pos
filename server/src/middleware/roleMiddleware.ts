import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const requireRole =
  (roles: Array<'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER'>) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
