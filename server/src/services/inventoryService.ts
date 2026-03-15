// src/services/inventoryService.ts
import { Inventory } from '../models';

export const inventoryService = {
  async getInventoryForProduct(tenantId: string, productId: string) {
    return Inventory.findOne({ tenant: tenantId, product: productId });
  },

  async adjustInventory(tenantId: string, productId: string, delta: number) {
    const inv = await Inventory.findOneAndUpdate(
      { tenant: tenantId, product: productId },
      { $inc: { quantityOnHand: delta } },
      { new: true, upsert: true },
    );
    return inv;
  },

  async listInventory(tenantId: string) {
    return Inventory.find({ tenant: tenantId }).populate('product');
  },
};
