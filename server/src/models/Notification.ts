import { Schema, model, Model } from 'mongoose';
import { INotification } from '../types/notification.types';

type NotificationModel = Model<INotification>;

const notificationSchema = new Schema<INotification, NotificationModel>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'SMS'],
      default: 'IN_APP',
    },
    status: {
      type: String,
      enum: ['UNREAD', 'READ', 'SENT', 'FAILED'],
      default: 'UNREAD',
    },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

notificationSchema.index({ tenant: 1, user: 1, createdAt: -1 });

export const Notification = model<INotification, NotificationModel>(
  'Notification',
  notificationSchema,
);
