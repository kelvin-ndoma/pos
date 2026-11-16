// src/services/reportService.ts
import { Sale, Product } from '../models';
import { Types } from 'mongoose';

type SalesGroupBy =
  | 'DAY'
  | 'WEEK'
  | 'MONTH'
  | 'PRODUCT'
  | 'CATEGORY'
  | 'CUSTOMER'
  | 'USER';

interface SalesReportFilters {
  fromDate?: string;
  toDate?: string;
  customerId?: string;
  userId?: string;
  productId?: string;
  categoryId?: string;
  groupBy: SalesGroupBy;
}

interface InventoryReportFilters {
  categoryId?: string;
  supplierId?: string;
  lowStockOnly?: boolean;
}

export const reportService = {
  async getSalesReport(tenantId: string, filters: SalesReportFilters) {
    const query: any = { tenant: new Types.ObjectId(tenantId) };

    if (filters.fromDate || filters.toDate) {
      query.createdAt = {};
      if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
      if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate);
    }

    if (filters.customerId) {
      query.customer = new Types.ObjectId(filters.customerId);
    }

    if (filters.userId) {
      query.user = new Types.ObjectId(filters.userId);
    }

    // Note: productId/categoryId grouping will come from aggregation later.
    // For now, we just fetch Sale docs; real grouping is still TODO.

    const sales = await Sale.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('customer')
      .populate('user');

    return {
      groupBy: filters.groupBy,
      count: sales.length,
      sales,
    };
  },

  async getInventoryReport(tenantId: string, filters: InventoryReportFilters) {
    const query: any = {
      tenant: new Types.ObjectId(tenantId),
      trackInventory: true,
    };

    // Filter by category (Product.category)
    if (filters.categoryId) {
      query.category = new Types.ObjectId(filters.categoryId);
    }

    // Low stock: quantityOnHand below reorderLevel (default 5)
    if (filters.lowStockOnly) {
      query.$expr = {
        $lt: ['$quantityOnHand', { $ifNull: ['$reorderLevel', 5] }],
      };
    }

    const items = await Product.find(query)
      .sort({ name: 1 })
      .populate('category');

    // You can add computed value here if you want:
    const mapped = items.map((p) => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      quantityOnHand: p.quantityOnHand,
      reorderLevel: p.reorderLevel ?? 5,
      costPrice: p.costPrice,
      stockValue:
        (p.costPrice ?? 0) * (p.quantityOnHand ?? 0),
    }));

    return {
      count: mapped.length,
      items: mapped,
    };
  },
};
