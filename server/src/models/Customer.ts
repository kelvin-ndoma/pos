import { Schema, model, Model } from 'mongoose';
import { ICustomer } from '../types/customer.types';

type CustomerModel = Model<ICustomer>;

const customerSchema = new Schema<ICustomer, CustomerModel>(
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
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

customerSchema.index({ tenant: 1, name: 1 });

export const Customer = model<ICustomer, CustomerModel>('Customer', customerSchema);
