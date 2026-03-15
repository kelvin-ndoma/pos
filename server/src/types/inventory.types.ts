import { Types } from 'mongoose';

export interface IInventory {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  product: Types.ObjectId;
  quantityOnHand: number;
  reorderLevel?: number;
  lastPurchaseAt?: Date;
  lastSaleAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
