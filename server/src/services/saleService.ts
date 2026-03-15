// src/services/saleService.ts
import mongoose, { Types } from 'mongoose';
import { Sale, SaleItem, Product, TaxRule } from '../models';
import {
  CreateSaleInput,
  UpdateSaleInput,
} from '../validators/sale.validator';
import {
  getPaginationOptions,
  buildPaginatedResult,
  PaginatedResult,
} from '../utils/pagination';

interface ListSalesQuery {
  page?: string | number;
  limit?: string | number;
  from?: string;
  to?: string;
  customerId?: string;
  userId?: string;
  status?: string;
  search?: string;
}

export const saleService = {
  async createSale(
    tenantId: string,
    input: CreateSaleInput & { userId: string },
  ) {
    if (!input.items.length) {
      throw new Error('Sale must have at least one item');
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Load all products (with taxRule) once
      const productIds = input.items.map((i) => i.productId);
      const products = await Product.find({
        _id: { $in: productIds },
        tenant: tenantId,
      })
        .populate('taxRule')
        .session(session);

      const productMap = new Map<string, any>();
      for (const p of products) {
        productMap.set(p._id.toString(), p);
      }

      // 1) Reserve stock: decrement quantityOnHand per product
      for (const item of input.items) {
        const res = await Product.updateOne(
          {
            _id: item.productId,
            tenant: tenantId,
            quantityOnHand: { $gte: item.quantity },
          },
          {
            $inc: { quantityOnHand: -item.quantity },
          },
          { session },
        );

        if (res.matchedCount === 0) {
          throw new Error(
            'Insufficient stock for one or more products',
          );
        }
      }

      // 2) Compute line-level amounts (VAT exclusive)
      const saleItemsPayload: any[] = [];

      let subtotal = 0;
      let taxTotal = 0;
      let discountTotal = 0;

      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error('Product not found for sale item');
        }

        const unitPrice =
          typeof item.unitPrice === 'number'
            ? item.unitPrice
            : product.salePrice;

        const quantity = item.quantity;
        const baseAmount = unitPrice * quantity;

        const discountAmount = item.discountAmount || 0;
        const lineNet = baseAmount - discountAmount;

        // taxRate from product.taxRule (if any)
        const rule = product.taxRule as any | undefined;
        const rawRate =
          rule && typeof rule.rate === 'number' ? rule.rate : 0;
        const taxRate = rawRate; // percentage, e.g. 16

        const taxAmount = lineNet * (taxRate / 100);
        const lineTotal = lineNet + taxAmount;

        subtotal += lineNet;
        taxTotal += taxAmount;
        discountTotal += discountAmount;

        saleItemsPayload.push({
          tenant: tenantId,
          sale: undefined, // fill after Sale is created
          product: item.productId,
          quantity,
          unitPrice,
          taxRate,
          taxAmount,
          discountAmount,
          lineNet,
          lineTotal,
        });
      }

      const grandTotal = subtotal + taxTotal;
      const paidAmount = input.paidAmount;
      const balance = grandTotal - paidAmount;

      // 3) Create Sale
      const [sale] = await Sale.create(
        [
          {
            tenant: tenantId,
            customer: input.customerId,
            user: input.userId,
            status: input.status || 'COMPLETED',
            subtotal,
            taxTotal,
            discountTotal,
            grandTotal,
            paidAmount,
            balance,
            reference: input.reference,
          },
        ],
        { session },
      );

      // 4) Create SaleItems with sale id
      const items = await SaleItem.insertMany(
        saleItemsPayload.map((i) => ({
          ...i,
          sale: sale._id,
        })),
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return { sale, items };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  },

  async getSale(tenantId: string, id: string) {
    const sale = await Sale.findOne({
      _id: id,
      tenant: tenantId,
    }).populate('customer user');
    if (!sale) return null;

    const items = await SaleItem.find({
      tenant: tenantId,
      sale: sale._id,
    }).populate('product');

    return { sale, items };
  },

  async listSales(
    tenantId: string,
    query: ListSalesQuery,
  ): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationOptions(query, {
      page: 1,
      limit: 20,
    });

    const filter: any = {
      tenant: new Types.ObjectId(tenantId),
    };

    // Customer filter
    if (query.customerId) {
      filter.customer = new Types.ObjectId(query.customerId);
    }

    // User (cashier) filter
    if (query.userId) {
      filter.user = new Types.ObjectId(query.userId);
    }

    // Status filter
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    // Date range filter (createdAt)
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) {
        filter.createdAt.$gte = new Date(query.from);
      }
      if (query.to) {
        const end = new Date(query.to);
        end.setHours(23, 59, 59, 999); // include entire day
        filter.createdAt.$lte = end;
      }
    }

    // Search: reference or id suffix
    if (query.search) {
      const search = query.search.trim();
      const regex = new RegExp(search, 'i');

      const orConditions: any[] = [{ reference: regex }];

      if (search.length >= 4 && search.length <= 24) {
        orConditions.push({
          _id: { $regex: search, $options: 'i' },
        });
      }

      filter.$or = orConditions;
    }

    const [items, total] = await Promise.all([
      Sale.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customer user'),
      Sale.countDocuments(filter),
    ]);

    return buildPaginatedResult(items, total, { page, limit, skip });
  },

  async updateSale(
    tenantId: string,
    id: string,
    input: UpdateSaleInput,
  ) {
    // If not changing status to VOID, do a simple update
    if (!input.status || input.status !== 'VOID') {
      const update: any = {};
      if (input.status) update.status = input.status;
      if (typeof input.paidAmount === 'number') {
        update.paidAmount = input.paidAmount;
      }
      if (typeof input.reference === 'string') {
        update.reference = input.reference;
      }

      const sale = await Sale.findOneAndUpdate(
        { _id: id, tenant: tenantId },
        update,
        { new: true },
      );

      return sale;
    }

    // We are voiding the sale: restore inventory
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const sale = await Sale.findOne({
        _id: id,
        tenant: tenantId,
      }).session(session);
      if (!sale) {
        throw new Error('Sale not found');
      }

      if (sale.status === 'VOID') {
        await session.commitTransaction();
        session.endSession();
        return sale;
      }

      const items = await SaleItem.find({
        tenant: tenantId,
        sale: sale._id,
      }).session(session);

      for (const item of items) {
        await Product.updateOne(
          {
            _id: item.product,
            tenant: tenantId,
          },
          {
            $inc: { quantityOnHand: item.quantity },
          },
          { session },
        );
      }

      sale.status = 'VOID';
      await sale.save({ session });

      await session.commitTransaction();
      session.endSession();

      return sale;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  },
};
