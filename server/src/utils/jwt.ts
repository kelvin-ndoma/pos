// src/utils/jwt.ts
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { PlatformRole, TenantRole } from '../middleware/authMiddleware';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: TenantRole;
  platformRole?: PlatformRole;
}

const accessTokenOptions: SignOptions = {
  // jsonwebtoken types allow string or number; ensure TS sees it as such
  expiresIn: env.JWT_EXPIRE as unknown as jwt.SignOptions['expiresIn'],
};

export const signJwt = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, accessTokenOptions);
};

export const verifyJwt = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
