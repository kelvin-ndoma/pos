// src/types/sale.types.ts
import { Types } from 'mongoose';

export type SaleStatus = 'OPEN' | 'COMPLETED' | 'VOID';
export type SaleType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type KitchenStatus =
  | 'NEW'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'CANCELLED';

export interface ISale {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  customer?: Types.ObjectId;
  user: Types.ObjectId;

  status: SaleStatus;

  // restaurant fields
  type: SaleType;
  table?: Types.ObjectId;
  covers?: number;
  notes?: string;
  kitchenStatus: KitchenStatus;

  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paidAmount: number;
  balance: number;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISaleItem {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  sale: Types.ObjectId;
  product: Types.ObjectId;

  quantity: number;
  unitPrice: number;   // VAT‑exclusive unit price

  taxRate: number;     // e.g. 16 or 0
  taxAmount: number;   // tax for this line

  discountAmount: number;

  lineNet: number;     // net amount before tax (after discount)
  lineTotal: number;   // lineNet + taxAmount

  createdAt: Date;
  updatedAt: Date;
}
