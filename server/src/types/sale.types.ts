import { Types } from 'mongoose';

export type SaleStatus = 'OPEN' | 'COMPLETED' | 'VOID';

export interface ISale {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  customer?: Types.ObjectId;
  user: Types.ObjectId;          // cashier
  status: SaleStatus;
  subtotal: number;              // sum of lineNet
  taxTotal: number;              // sum of line taxAmount
  discountTotal: number;         // sum of discounts (before tax)
  grandTotal: number;            // subtotal - discountTotal + taxTotal
  paidAmount: number;
  balance: number;
  reference?: string;            // invoice/receipt number
  createdAt: Date;
  updatedAt: Date;
}

export interface ISaleItem {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  sale: Types.ObjectId;
  product: Types.ObjectId;

  quantity: number;
  unitPrice: number;             // VAT-exclusive unit price

  taxRate: number;               // e.g. 16, 0
  taxAmount: number;             // tax for this line

  discountAmount: number;        // discount before tax

  lineNet: number;               // net amount before tax (after discount)
  lineTotal: number;             // lineNet + taxAmount

  createdAt: Date;
  updatedAt: Date;
}
