import { Types } from 'mongoose';

export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface IPayment {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  sale?: Types.ObjectId;       // payment for a sale
  reference?: string;          // mpesa ref, etc.
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
