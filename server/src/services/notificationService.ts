// src/services/notificationService.ts
import { Notification } from '../models';

export const notificationService = {
  async createNotification(tenantId: string, data: {
    userId?: string;
    title: string;
    message: string;
    channel: 'IN_APP' | 'EMAIL' | 'SMS';
    data?: Record<string, any>;
  }) {
    return Notification.create({
      tenant: tenantId,
      user: data.userId,
      title: data.title,
      message: data.message,
      channel: data.channel,
      status: 'UNREAD',
      data: data.data,
    });
  },

  async listNotifications(tenantId: string, userId?: string) {
    const query: any = { tenant: tenantId };
    if (userId) query.user = userId;
    return Notification.find(query).sort({ createdAt: -1 });
  },

  async markAsRead(tenantId: string, id: string) {
    return Notification.findOneAndUpdate(
      { _id: id, tenant: tenantId },
      { status: 'READ' },
      { new: true },
    );
  },
};
