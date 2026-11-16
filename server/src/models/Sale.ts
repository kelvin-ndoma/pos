// src/models/Sale.ts
import { Schema, model, Model } from 'mongoose';
import { ISale } from '../types/sale.types';

type SaleModel = Model<ISale>;

const saleSchema = new Schema<ISale, SaleModel>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'COMPLETED', 'VOID'],
      default: 'COMPLETED',
    },

    type: {
      type: String,
      enum: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'],
      default: 'TAKEAWAY',
      index: true,
    },
    table: { type: Schema.Types.ObjectId, ref: 'Table' },
    covers: { type: Number },
    notes: { type: String, trim: true },
    kitchenStatus: {
      type: String,
      enum: ['NEW', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'],
      default: 'NEW',
      index: true,
    },

    subtotal: { type: Number, required: true },
    taxTotal: { type: Number, required: true },
    discountTotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    balance: { type: Number, required: true },
    reference: { type: String, trim: true },
  },
  { timestamps: true },
);

saleSchema.index({ tenant: 1, createdAt: -1 });
saleSchema.index({ tenant: 1, kitchenStatus: 1, createdAt: -1 });

export const Sale = model<ISale, SaleModel>('Sale', saleSchema);
