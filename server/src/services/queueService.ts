// src/services/queueService.ts
import Queue from 'bull';
import { env } from '../config/env';

export const emailQueue = new Queue('email', env.REDIS_URL);
export const reportQueue = new Queue('report', env.REDIS_URL);

export const queueService = {
  async enqueueEmailJob(data: any) {
    await emailQueue.add(data);
  },
  async enqueueReportJob(data: any) {
    await reportQueue.add(data);
  },
};
