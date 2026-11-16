// src/config/env.ts
import dotenv from 'dotenv';
import path from 'path';

const nodeEnv = process.env.NODE_ENV || 'development';

dotenv.config({
  path:
    nodeEnv === 'test'
      ? path.resolve(process.cwd(), '.env.test')
      : path.resolve(process.cwd(), '.env'),
});

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

export const env = {
  // basic
  NODE_ENV: nodeEnv,
  PORT: Number(process.env.PORT || 3000),

  // db
  MONGODB_URI: process.env.MONGODB_URI || '',
  USE_IN_MEMORY_DB: process.env.USE_IN_MEMORY_DB === 'true',

 // jwt
JWT_SECRET: required('JWT_SECRET'),
JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
REFRESH_TOKEN_SECRET: required('REFRESH_TOKEN_SECRET'),
REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE || '30d',


  // redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // tenant
  MAX_TENANTS: Number(process.env.MAX_TENANTS || 1000),
  DEFAULT_TENANT_PLAN: process.env.DEFAULT_TENANT_PLAN || 'free',

  // security
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001',
  RATE_LIMIT_WINDOW: Number(process.env.RATE_LIMIT_WINDOW || 900000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 100),

  // email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@pos.com',
};
