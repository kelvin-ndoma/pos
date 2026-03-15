import { Schema, model, Model } from 'mongoose';
import { IAuditLog } from '../types/audit.types';

type AuditLogModel = Model<IAuditLog>;

const auditLogSchema = new Schema<IAuditLog, AuditLogModel>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

auditLogSchema.index({ tenant: 1, createdAt: -1 });
auditLogSchema.index({ tenant: 1, entity: 1, entityId: 1 });

export const AuditLog = model<IAuditLog, AuditLogModel>('AuditLog', auditLogSchema);
