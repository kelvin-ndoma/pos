// src/config/db.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env';
import { logger } from './logger';

let isConnected = false;
let memoryServer: MongoMemoryServer | null = null;

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

async function connectWithUri(uri: string): Promise<void> {
  await mongoose.connect(uri, {
    autoIndex: env.NODE_ENV !== 'production',
  });
  logger.info('MongoDB connect() resolved');
}

async function connectInMemory(): Promise<void> {
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri('inventory-saas');
  await connectWithUri(uri);
  logger.warn(
    'Using in-memory MongoDB for development. Data is lost when the server stops.',
  );
}

export const connectDB = async (): Promise<void> => {
  if (isConnected) return;

  mongoose.set('strictQuery', true);

  if (env.USE_IN_MEMORY_DB) {
    try {
      await connectInMemory();
      return;
    } catch (error) {
      logger.error('In-memory MongoDB connection error', { error });
      process.exit(1);
    }
  }

  if (!env.MONGODB_URI) {
    logger.error('Missing required env var: MONGODB_URI');
    process.exit(1);
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 8000,
    });
    logger.info('MongoDB connect() resolved');
  } catch (error) {
    if (env.NODE_ENV === 'development') {
      logger.warn('MongoDB Atlas unavailable, falling back to in-memory database', {
        message: error instanceof Error ? error.message : String(error),
      });

      try {
        await connectInMemory();
        return;
      } catch (fallbackError) {
        logger.error('In-memory MongoDB fallback failed', { error: fallbackError });
        process.exit(1);
      }
    }

    logger.error('MongoDB initial connection error', { error });
    process.exit(1);
  }
};

export const getDbStatus = () => ({
  state: mongoose.connection.readyState, // 0=disconnected,1=connected,2=connecting,3=disconnecting
  isConnected,
  inMemory: memoryServer !== null,
});
