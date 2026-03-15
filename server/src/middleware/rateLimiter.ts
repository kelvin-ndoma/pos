import { Request, Response, NextFunction } from 'express';

const windowMs = 60 * 1000;
const maxRequests = 100;
const hits = new Map<string, { count: number; start: number }>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const entry = hits.get(key) || { count: 0, start: now };

  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }

  entry.count += 1;
  hits.set(key, entry);

  if (entry.count > maxRequests) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  return next();
};
