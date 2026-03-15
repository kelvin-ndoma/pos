// src/config/db.ts
import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

let isConnected = false;

const connection = mongoose.connection;

connection.on('connected', () => {
  isConnected = true;
  logger.info('MongoDB event: connected');
});

connection.on('open', () => {
  logger.info('MongoDB event: open (ready for operations)');
});

connection.on('error', (err) => {
  logger.error('MongoDB event: error', { err });
});

connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB event: disconnected');
});

export const connectDB = async (): Promise<void> => {
  if (isConnected) return;

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
    });

    logger.info('MongoDB connect() resolved');
  } catch (error) {
    logger.error('MongoDB initial connection error', { error });
    process.exit(1);
  }
};

export const getDbStatus = () => ({
  state: mongoose.connection.readyState, // 0=disconnected,1=connected,2=connecting,3=disconnecting
  isConnected,
});
