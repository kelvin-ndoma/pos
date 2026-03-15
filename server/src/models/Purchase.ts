import { Schema, model, Model } from 'mongoose';
import { IPurchase } from '../types/purchase.types';

type PurchaseModel = Model<IPurchase>;

const purchaseSchema = new Schema<IPurchase, PurchaseModel>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'],
      default: 'DRAFT',
    },
    subtotal: { type: Number, required: true },
    taxTotal: { type: Number, required: true },
    discountTotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    reference: { type: String, trim: true },
  },
  { timestamps: true },
);

purchaseSchema.index({ tenant: 1, createdAt: -1 });

export const Purchase = model<IPurchase, PurchaseModel>('Purchase', purchaseSchema);
