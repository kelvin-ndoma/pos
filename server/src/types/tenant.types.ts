// src/types/tenant.types.ts
import { Types } from 'mongoose';

export interface ITenant {
  _id: Types.ObjectId;
  name: string;
  slug: string;        // e.g. kndoma-shop
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
