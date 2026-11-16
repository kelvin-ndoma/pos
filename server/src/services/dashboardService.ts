// src/services/dashboardService.ts
import { Product, Sale } from '../models';
import { Types } from 'mongoose';

export const dashboardService = {
  async getSummary(tenantId: string) {
    const tenantObjectId = new Types.ObjectId(tenantId);

    const stockAgg = await Product.aggregate([
      {
        $match: {
          tenant: tenantObjectId,
        },
      },
      {
        $group: {
          _id: null,
          stockValue: {
            $sum: {
              $multiply: [
                { $ifNull: ['$costPrice', 0] },
                { $ifNull: ['$quantityOnHand', 0] },
              ],
            },
          },
        },
      },
    ]);

    const stockValue = stockAgg[0]?.stockValue ?? 0;

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const salesAgg = await Sale.aggregate([
      {
        $match: {
          tenant: tenantObjectId,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          todaySales: {
            $sum: { $ifNull: ['$grandTotal', 0] },
          },
        },
      },
    ]);

    const todaySales = salesAgg[0]?.todaySales ?? 0;

    const lowStockCount = await Product.countDocuments({
      tenant: tenantObjectId,
      trackInventory: true,
      $expr: {
        $lt: ['$quantityOnHand', { $ifNull: ['$reorderLevel', 5] }],
      },
    });

    return {
      stockValue,
      todaySales,
      lowStockCount,
    };
  },
};
