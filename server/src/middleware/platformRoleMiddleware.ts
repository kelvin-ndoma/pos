// src/middleware/platformRoleMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { PlatformRole } from './authMiddleware'; // or wherever you defined it

export function requirePlatformRole(allowedRoles: PlatformRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const platformRole = (req as any).platformRole as PlatformRole | undefined;

    if (!platformRole || platformRole === 'NONE') {
      res.status(403).json({ error: 'Platform access denied' });
      return;
    }

    if (!allowedRoles.includes(platformRole)) {
      res.status(403).json({ error: 'Insufficient platform role' });
      return;
    }

    next();
    return; // explicit return to satisfy noImplicitReturns
  };
}
