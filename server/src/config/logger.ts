// src/config/logger.ts
import winston from 'winston';
import path from 'path';

const { combine, timestamp, json, colorize, simple, errors } = winston.format;
const isProduction = process.env.NODE_ENV === 'production';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction
      ? combine(timestamp(), json())
      : combine(colorize(), simple()),
  }),
];

if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
    }),
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: combine(timestamp(), errors({ stack: true }), json()),
  defaultMeta: { service: 'pos-backend' },
  transports,
});
