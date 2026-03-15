// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

interface AppError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;

  // Log full error (with stack) for debugging/monitoring
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    statusCode: status,
    details: err.details,
  });

  // Minimal, safe response
  if (status >= 500) {
    return res.status(status).json({
      error: 'Internal server error',
    });
  }

  return res.status(status).json({
    error: err.message || 'Request failed',
    details: err.details,
  });
};
