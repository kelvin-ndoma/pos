// src/models/TenantUser.ts
import { Schema, model, Model } from 'mongoose';
import { ITenantUser } from '../types/tenantUser.types';

type TenantUserModel = Model<ITenantUser>;

const tenantUserSchema = new Schema<ITenantUser, TenantUserModel>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roles: {
      type: [String],
      enum: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'],
      default: ['VIEWER'],
    },
  },
  { timestamps: true },
);

// Each user can have at most one membership per tenant
tenantUserSchema.index({ tenant: 1, user: 1 }, { unique: true });

export const TenantUser = model<ITenantUser, TenantUserModel>(
  'TenantUser',
  tenantUserSchema,
);
