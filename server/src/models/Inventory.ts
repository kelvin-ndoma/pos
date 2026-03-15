import { Schema, model, Model } from 'mongoose';
import { IInventory } from '../types/inventory.types';

type InventoryModel = Model<IInventory>;

const inventorySchema = new Schema<IInventory, InventoryModel>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantityOnHand: { type: Number, required: true, default: 0 },
    reorderLevel: { type: Number },
    lastPurchaseAt: { type: Date },
    lastSaleAt: { type: Date },
  },
  { timestamps: true },
);

inventorySchema.index({ tenant: 1, product: 1 }, { unique: true });

export const Inventory = model<IInventory, InventoryModel>('Inventory', inventorySchema);
