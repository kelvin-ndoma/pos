// src/services/saleService.ts
import mongoose, { Types } from 'mongoose';
import { Sale, SaleItem, Product, TaxRule, Table } from '../models';
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

// Define kitchen status type
export type KitchenStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED';

// Options for listing kitchen orders
export interface KitchenOrdersOptions {
  status?: KitchenStatus | 'ALL';
  type?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ALL';
}

// Define the service interface for better TypeScript inference
interface SaleService {
  createSale(
    tenantId: string, 
    input: CreateSaleInput & { userId: string }
  ): Promise<{ sale: any; items: any[] }>;
  
  getSale(
    tenantId: string, 
    id: string
  ): Promise<{ sale: any; items: any[] } | null>;
  
  listSales(
    tenantId: string, 
    query: ListSalesQuery
  ): Promise<PaginatedResult<any>>;
  
  updateSale(
    tenantId: string, 
    id: string, 
    input: UpdateSaleInput
  ): Promise<any>;
  
  listKitchenOrders(
    tenantId: string, 
    options?: KitchenOrdersOptions
  ): Promise<any[]>;
  
  updateKitchenStatus(
    tenantId: string, 
    id: string, 
    nextStatus: KitchenStatus
  ): Promise<any>;
}

export const saleService: SaleService = {
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

      // Validate table belongs to tenant for dine‑in and check availability
      let tableDoc: any = null;
      const isDineIn = input.type === 'DINE_IN';
      if (isDineIn && input.tableId) {
        tableDoc = await Table.findOne({
          _id: input.tableId,
          tenant: tenantId,
        }).session(session);

        if (!tableDoc) {
          throw new Error('Table not found for this tenant');
        }

        // Check if table is available for dine-in
        if (tableDoc.status !== 'AVAILABLE') {
          throw new Error(`Table is not available (current status: ${tableDoc.status})`);
        }
      }

      // 1) Reserve stock for tracked products only
      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product?.trackInventory) continue;

        const res = await Product.updateOne(
          {
            _id: item.productId,
            tenant: tenantId,
            trackInventory: true,
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
        const taxRate = rawRate; // store as percentage
        const taxAmount = lineNet * (taxRate / 100); // convert to decimal
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

      // Dine-in defaults to OPEN, others to COMPLETED
      const status =
        input.status ||
        (isDineIn ? 'OPEN' : 'COMPLETED');

      // 3) Create Sale (with restaurant + kitchen fields)
      const [sale] = await Sale.create(
        [
          {
            tenant: tenantId,
            customer: input.customerId,
            user: input.userId,
            status,

            type: input.type || 'TAKEAWAY',
            table: tableDoc?._id,
            covers: input.covers,
            notes: input.notes,
            kitchenStatus: 'NEW', // Always start with NEW for kitchen

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

      // 5) Table handling for dine‑in
      if (tableDoc) {
        // For DINE_IN, table becomes OCCUPIED and linked to this sale.
        await Table.updateOne(
          { _id: tableDoc._id, tenant: tenantId },
          {
            $set: {
              status: 'OCCUPIED',
              currentSale: sale._id,
            },
          },
          { session },
        );
      }

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
    }).populate('customer user table');
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
        .populate('customer user table'),
      Sale.countDocuments(filter),
    ]);

    return buildPaginatedResult(items, total, { page, limit, skip });
  },

  async updateSale(
    tenantId: string,
    id: string,
    input: UpdateSaleInput,
  ) {
    // If not changing status to VOID or COMPLETED, do a simple update
    const isVoid = input.status === 'VOID';
    const isCompleted = input.status === 'COMPLETED';

    if (!isVoid && !isCompleted) {
      const update: any = {};
      if (input.status) update.status = input.status;
      if (typeof input.paidAmount === 'number') {
        update.paidAmount = input.paidAmount;
      }
      if (typeof input.reference === 'string') {
        update.reference = input.reference;
      }
      if (typeof input.type === 'string') {
        update.type = input.type;
      }
      if (typeof input.covers === 'number') {
        update.covers = input.covers;
      }
      if (typeof input.notes === 'string') {
        update.notes = input.notes;
      }

      const sale = await Sale.findOneAndUpdate(
        { _id: id, tenant: tenantId },
        update,
        { new: true },
      );

      return sale;
    }

    // We are voiding or completing the sale: we may need inventory + table updates
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

      // If already in that terminal status, just return
      if (isVoid && sale.status === 'VOID') {
        await session.commitTransaction();
        session.endSession();
        return sale;
      }
      if (isCompleted && sale.status === 'COMPLETED') {
        await session.commitTransaction();
        session.endSession();
        return sale;
      }

      if (isVoid) {
        // Restore inventory
        const items = await SaleItem.find({
          tenant: tenantId,
          sale: sale._id,
        }).session(session);

        for (const item of items) {
          await Product.updateOne(
            {
              _id: item.product,
              tenant: tenantId,
              trackInventory: true,
            },
            {
              $inc: { quantityOnHand: item.quantity },
            },
            { session },
          );
        }

        sale.status = 'VOID';
        await sale.save({ session });
        
        // If there was a table attached, free it when VOID
        if (sale.table) {
          await Table.updateOne(
            { _id: sale.table, tenant: tenantId },
            { $set: { status: 'AVAILABLE', currentSale: null } },
            { session },
          );
        }
      }

      if (isCompleted) {
        sale.status = 'COMPLETED';
        if (typeof input.paidAmount === 'number') {
          sale.paidAmount = input.paidAmount;
          sale.balance = (sale.grandTotal || 0) - input.paidAmount;
        }
        await sale.save({ session });
        
        // When sale is COMPLETED (bill paid), free the table
        if (sale.table) {
          await Table.updateOne(
            { _id: sale.table, tenant: tenantId },
            { $set: { status: 'AVAILABLE', currentSale: null } },
            { session },
          );
        }
      }

      await session.commitTransaction();
      session.endSession();

      return sale;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  },

  // === KITCHEN METHODS ===

  /**
   * List orders for kitchen display
   * Filters by kitchen status and order type
   * Shows only orders that need kitchen preparation (NEW, PREPARING, READY)
   */
  async listKitchenOrders(
    tenantId: string,
    options?: KitchenOrdersOptions,
  ) {
    const filter: any = {
      tenant: new Types.ObjectId(tenantId),
      // Only show orders that need kitchen preparation
      // Exclude VOID orders
      status: { $ne: 'VOID' },
      // Only include orders that are active in kitchen
      kitchenStatus: { $in: ['NEW', 'PREPARING', 'READY'] },
    };

    // Filter by specific kitchen status if provided
    if (options?.status && options.status !== 'ALL') {
      filter.kitchenStatus = options.status;
    }

    // Filter by order type if provided
    if (options?.type && options.type !== 'ALL') {
      filter.type = options.type;
    }

    // Get orders with their items populated
    const orders = await Sale.find(filter)
      .sort({ createdAt: 1 }) // Oldest first (FIFO)
      .limit(100) // Limit to last 100 orders for performance
      .populate('table', 'name area')
      .populate('user', 'name')
      .populate('customer', 'name')
      .lean();

    const saleIds = orders.map((order) => order._id);
    const allItems = saleIds.length
      ? await SaleItem.find({
          tenant: tenantId,
          sale: { $in: saleIds },
        })
          .populate('product', 'name sku')
          .lean()
      : [];

    const itemsBySale = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const saleId = item.sale.toString();
      const bucket = itemsBySale.get(saleId) || [];
      bucket.push(item);
      itemsBySale.set(saleId, bucket);
    }

    return orders.map((order) => ({
      ...order,
      items: itemsBySale.get(order._id.toString()) || [],
    }));
  },

  /**
   * Update kitchen status for an order
   * Can only update orders that are not voided
   */
  async updateKitchenStatus(
    tenantId: string,
    id: string,
    nextStatus: KitchenStatus,
  ) {
    // Validate status
    if (!['NEW', 'PREPARING', 'READY', 'SERVED'].includes(nextStatus)) {
      throw new Error('Invalid kitchen status');
    }

    const sale = await Sale.findOneAndUpdate(
      { 
        _id: id, 
        tenant: tenantId,
        // Can't update kitchen status for voided orders
        status: { $ne: 'VOID' }
      },
      { kitchenStatus: nextStatus },
      { new: true },
    )
      .populate('table', 'name area')
      .populate('user', 'name')
      .populate('customer', 'name');

    if (!sale) {
      throw new Error('Order not found or cannot be updated');
    }

    // Optional: Add timestamp when status changes
    const updateData: any = { kitchenStatus: nextStatus };
    
    // Add timestamps for specific status changes
    if (nextStatus === 'PREPARING') {
      updateData.startedAt = new Date();
    } else if (nextStatus === 'READY') {
      updateData.readyAt = new Date();
    } else if (nextStatus === 'SERVED') {
      updateData.servedAt = new Date();
    }

    await Sale.updateOne(
      { _id: id },
      { $set: updateData }
    );

    return sale;
  },
};