export class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorCodes = {
  // Auth errors (1000-1999)
  UNAUTHORIZED: 'AUTH_1001',
  INVALID_CREDENTIALS: 'AUTH_1002',
  TOKEN_EXPIRED: 'AUTH_1003',
  INVALID_TOKEN: 'AUTH_1004',

  // Validation errors (2000-2999)
  VALIDATION_ERROR: 'VAL_2001',
  INVALID_INPUT: 'VAL_2002',
  MISSING_FIELD: 'VAL_2003',

  // Resource errors (3000-3999)
  NOT_FOUND: 'RES_3001',
  ALREADY_EXISTS: 'RES_3002',
  DUPLICATE_ENTRY: 'RES_3003',

  // Permission errors (4000-4999)
  FORBIDDEN: 'PERM_4001',
  INSUFFICIENT_PERMISSIONS: 'PERM_4002',

  // Business logic errors (5000-5999)
  INSUFFICIENT_STOCK: 'BIZ_5001',
  INVALID_TRANSACTION: 'BIZ_5002',
  CANNOT_MODIFY: 'BIZ_5003',

  // System errors (9000-9999)
  INTERNAL_ERROR: 'SYS_9001',
  DATABASE_ERROR: 'SYS_9002',
  EXTERNAL_SERVICE_ERROR: 'SYS_9003',
} as const;