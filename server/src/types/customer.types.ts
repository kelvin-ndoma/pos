import { Types } from 'mongoose';

export interface ICustomer {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
