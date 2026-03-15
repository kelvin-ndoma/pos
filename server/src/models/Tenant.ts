// src/models/Tenant.ts
import { Schema, model, Model } from 'mongoose';
import { ITenant } from '../types/tenant.types';

type TenantModel = Model<ITenant>;

const tenantSchema = new Schema<ITenant, TenantModel>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);


export const Tenant = model<ITenant, TenantModel>('Tenant', tenantSchema);
