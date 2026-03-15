import { Types } from 'mongoose';

export interface IAuditLog {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  user?: Types.ObjectId;
  action: string;
  entity: string;
  entityId?: Types.ObjectId;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}
