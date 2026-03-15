import { Types } from 'mongoose';

export type PurchaseStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface IPurchase {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  supplier?: Types.ObjectId;
  user: Types.ObjectId;          // who created
  status: PurchaseStatus;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseItem {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  purchase: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  unitCost: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  lineTotal: number;
  createdAt: Date;
  updatedAt: Date;
}
