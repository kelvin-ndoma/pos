// src/services/inventoryService.ts
import { Product, Inventory } from '../models';

export const inventoryService = {
  async getInventoryForProduct(tenantId: string, productId: string) {
    const product = await Product.findOne({
      _id: productId,
      tenant: tenantId,
    }).select('name sku quantityOnHand trackInventory reorderLevel');

    if (!product) return null;

    return {
      tenant: tenantId,
      product: productId,
      quantityOnHand: product.quantityOnHand,
      reorderLevel: product.reorderLevel ?? 0,
      trackInventory: product.trackInventory,
    };
  },

  async adjustInventory(tenantId: string, productId: string, delta: number) {
    const filter: Record<string, unknown> = {
      _id: productId,
      tenant: tenantId,
    };

    if (delta < 0) {
      filter.quantityOnHand = { $gte: Math.abs(delta) };
    }

    const product = await Product.findOneAndUpdate(
      filter,
      { $inc: { quantityOnHand: delta } },
      { new: true },
    );

    if (!product) {
      throw new Error('Product not found or insufficient stock');
    }

    // Keep legacy Inventory collection in sync when present
    await Inventory.findOneAndUpdate(
      { tenant: tenantId, product: productId },
      {
        $set: { quantityOnHand: product.quantityOnHand },
        $setOnInsert: { reorderLevel: product.reorderLevel ?? 0 },
      },
      { upsert: true },
    );

    return product;
  },

  async listInventory(tenantId: string) {
    return Product.find({
      tenant: tenantId,
      trackInventory: true,
    })
      .select('name sku quantityOnHand reorderLevel costPrice category')
      .populate('category')
      .sort({ name: 1 });
  },
};
