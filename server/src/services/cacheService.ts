// src/services/cacheService.ts
import { createClient } from 'redis';
import { env } from '../config/env';

const client = createClient({ url: env.REDIS_URL });
client.connect().catch(console.error);

export const cacheService = {
  async get(key: string) {
    return client.get(key);
  },
  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await client.setEx(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  },
  async del(key: string) {
    await client.del(key);
  },
};
