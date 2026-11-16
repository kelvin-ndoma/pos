// src/models/SaleItem.ts
import { Schema, model, Model } from 'mongoose';
import { ISaleItem } from '../types/sale.types';

type SaleItemModel = Model<ISaleItem>;

const saleItemSchema = new Schema<ISaleItem, SaleItemModel>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    sale: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },

    taxRate: { type: Number, required: true },
    taxAmount: { type: Number, required: true },

    discountAmount: { type: Number, required: true },

    lineNet: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { timestamps: true },
);

saleItemSchema.index({ tenant: 1, sale: 1 });

export const SaleItem = model<ISaleItem, SaleItemModel>(
  'SaleItem',
  saleItemSchema,
);
