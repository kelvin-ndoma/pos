// src/services/purchaseService.ts
import { Purchase, PurchaseItem, Product } from '../models';
import { Types } from 'mongoose';
import {
  getPaginationOptions,
  buildPaginatedResult,
  PaginatedResult,
} from '../utils/pagination';

type ListPurchasesQuery = {
  page?: string | number;
  limit?: string | number;
  from?: string;
  to?: string;
  supplierId?: string;
  userId?: string;
  status?: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED' | 'ALL';
  search?: string;
};

export const purchaseService = {
  async createPurchase(
    tenantId: string,
    input: {
      supplierId?: string;
      userId: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitCost: number;
        discountAmount?: number;
      }>;
      reference?: string;
      status?: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
    },
  ) {
    if (!input.items.length) {
      throw new Error('Purchase must have at least one item');
    }

    const subtotal = input.items.reduce(
      (sum, i) => sum + i.unitCost * i.quantity,
      0,
    );
    const taxTotal = 0;
    const discountTotal = input.items.reduce(
      (sum, i) => sum + (i.discountAmount || 0),
      0,
    );
    const grandTotal = subtotal + taxTotal - discountTotal;

    const status = input.status || 'ORDERED';

    const purchase = await Purchase.create({
      tenant: tenantId,
      supplier: input.supplierId,
      user: input.userId,
      status,
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      reference: input.reference,
    });

    const items = await PurchaseItem.insertMany(
      input.items.map((i) => ({
        tenant: tenantId,
        purchase: purchase._id,
        product: i.productId,
        quantity: i.quantity,
        unitCost: i.unitCost,
        taxRate: 0,
        taxAmount: 0,
        discountAmount: i.discountAmount || 0,
        lineTotal: i.unitCost * i.quantity - (i.discountAmount || 0),
      })),
    );

    // If purchase is RECEIVED, immediately increase stock
    if (status === 'RECEIVED') {
      for (const i of input.items) {
        await Product.updateOne(
          {
            _id: i.productId,
            tenant: tenantId,
          },
          {
            $inc: { quantityOnHand: i.quantity },
          },
        );
      }
    }

    return { purchase, items };
  },

  async getPurchaseById(tenantId: string, id: string) {
    const purchase = await Purchase.findOne({
      _id: id,
      tenant: tenantId,
    })
      .populate('supplier user')
      .lean();

    if (!purchase) return null;

    const items = await PurchaseItem.find({
      tenant: tenantId,
      purchase: purchase._id,
    })
      .populate('product')
      .lean();

    return { purchase, items };
  },

  async listPurchases(
    tenantId: string,
    query: ListPurchasesQuery,
  ): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationOptions(query, {
      page: 1,
      limit: 20,
    });

    const filter: any = {
      tenant: new Types.ObjectId(tenantId),
    };

    if (query.supplierId) {
      filter.supplier = new Types.ObjectId(query.supplierId);
    }

    if (query.userId) {
      filter.user = new Types.ObjectId(query.userId);
    }

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) {
        filter.createdAt.$gte = new Date(query.from);
      }
      if (query.to) {
        const end = new Date(query.to);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (query.search) {
      const search = query.search.trim();
      const regex = new RegExp(search, 'i');
      const or: any[] = [{ reference: regex }];

      if (search.length >= 4 && search.length <= 24) {
        or.push({ _id: { $regex: search, $options: 'i' } });
      }

      filter.$or = or;
    }

    const [items, total] = await Promise.all([
      Purchase.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('supplier user')
        .lean(),
      Purchase.countDocuments(filter),
    ]);

    return buildPaginatedResult(items, total, { page, limit, skip });
  },
};
