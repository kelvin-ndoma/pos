import { Schema, model, Model } from 'mongoose';
import { IPurchaseItem } from '../types/purchase.types';

type PurchaseItemModel = Model<IPurchaseItem>;

const purchaseItemSchema = new Schema<IPurchaseItem, PurchaseItemModel>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    purchase: { type: Schema.Types.ObjectId, ref: 'Purchase', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    discountAmount: { type: Number, required: true, default: 0 },
    lineTotal: { type: Number, required: true },
  },
  { timestamps: true },
);

purchaseItemSchema.index({ tenant: 1, purchase: 1 });

export const PurchaseItem = model<IPurchaseItem, PurchaseItemModel>(
  'PurchaseItem',
  purchaseItemSchema,
);
