import { Types } from 'mongoose';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS';
export type NotificationStatus = 'UNREAD' | 'READ' | 'SENT' | 'FAILED';

export interface INotification {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  user?: Types.ObjectId;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
