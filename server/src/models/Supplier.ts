import { Schema, model, Model } from 'mongoose';
import { ISupplier } from '../types/supplier.types';

type SupplierModel = Model<ISupplier>;

const supplierSchema = new Schema<ISupplier, SupplierModel>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

supplierSchema.index({ tenant: 1, name: 1 });

export const Supplier = model<ISupplier, SupplierModel>('Supplier', supplierSchema);
