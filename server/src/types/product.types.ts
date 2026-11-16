import { Types } from 'mongoose';

export interface ICategory {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  name: string;
  sku: string;
  barcode?: string;
  category?: Types.ObjectId;
  description?: string;
  costPrice: number;
  salePrice: number;        // VAT exclusive price per unit
  quantityOnHand: number;
  reorderLevel?: number;
  taxRule?: Types.ObjectId; // reference to TaxRule
  isActive: boolean;
  trackInventory: boolean;
  createdAt: Date;
  updatedAt: Date;
}
