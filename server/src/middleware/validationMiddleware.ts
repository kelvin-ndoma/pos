// src/middleware/validationMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

const validate =
  (schema: ZodTypeAny, source: 'body' | 'query' | 'params'): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse((req as any)[source]);
      (req as any)[source] = parsed;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues; // inferred type

        return res.status(400).json({
          error: `Invalid ${source}`,
          details: issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      return next(err);
    }
  };

export const validateBody = (schema: ZodTypeAny): RequestHandler =>
  validate(schema, 'body');

export const validateQuery = (schema: ZodTypeAny): RequestHandler =>
  validate(schema, 'query');

export const validateParams = (schema: ZodTypeAny): RequestHandler =>
  validate(schema, 'params');
