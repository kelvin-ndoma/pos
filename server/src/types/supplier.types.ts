import { Types } from 'mongoose';

export interface ISupplier {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
