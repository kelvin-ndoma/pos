// src/services/productService.ts
import { Types } from 'mongoose';
import { Product, TaxRule } from '../models';
import {
  CreateProductInput,
  UpdateProductInput,
} from '../validators/product.validator';
import {
  getPaginationOptions,
  buildPaginatedResult,
  PaginatedResult,
} from '../utils/pagination';

interface ListProductsQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  categoryId?: string;
  isActive?: string;
}

function generateSkuFromName(name: string) {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 16);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return base ? `${base}-${suffix}` : suffix;
}

export const productService = {
  async listProducts(
    tenantId: string,
    query: ListProductsQuery,
  ): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationOptions(query, {
      page: 1,
      limit: 20,
    });

    const filter: any = {
      tenant: new Types.ObjectId(tenantId),
    };

    if (query.categoryId) {
      filter.category = new Types.ObjectId(query.categoryId);
    }

    if (query.isActive === 'true') {
      filter.isActive = true;
    } else if (query.isActive === 'false') {
      filter.isActive = false;
    }

    if (query.search) {
      const search = query.search.trim();
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { sku: regex },
        { barcode: regex },
      ];
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .populate('category taxRule'),
      Product.countDocuments(filter),
    ]);

    return buildPaginatedResult(items, total, { page, limit, skip });
  },

  async getProduct(tenantId: string, id: string) {
    return Product.findOne({
      _id: id,
      tenant: tenantId,
    }).populate('category taxRule');
  },

  async createProduct(tenantId: string, input: CreateProductInput) {
    let taxRuleId: Types.ObjectId | undefined;

    if (input.taxRule) {
      const rule = await TaxRule.findOne({
        _id: input.taxRule,
        tenant: tenantId,
      });
      if (!rule) {
        throw new Error('Invalid tax rule');
      }
      taxRuleId = rule._id;
    }

    const sku =
      input.sku && input.sku.trim().length > 0
        ? input.sku.trim()
        : generateSkuFromName(input.name);

    return Product.create({
      tenant: tenantId,
      name: input.name,
      sku,
      barcode: input.barcode,
      category: input.categoryId,
      description: input.description,
      costPrice: input.costPrice,
      salePrice: input.salePrice,
      quantityOnHand:
        typeof input.quantityOnHand === 'number'
          ? input.quantityOnHand
          : 0,
      trackInventory: input.trackInventory ?? true,
      isActive: input.isActive ?? true,
      taxRule: taxRuleId,
    });
  },

  async updateProduct(
    tenantId: string,
    id: string,
    input: UpdateProductInput,
  ) {
    const update: any = {};

    if (typeof input.name === 'string') update.name = input.name;
    if (typeof input.sku === 'string') update.sku = input.sku;
    if (typeof input.barcode === 'string')
      update.barcode = input.barcode;
    if (typeof input.categoryId === 'string')
      update.category = input.categoryId;
    if (typeof input.description === 'string')
      update.description = input.description;
    if (typeof input.costPrice === 'number')
      update.costPrice = input.costPrice;
    if (typeof input.salePrice === 'number')
      update.salePrice = input.salePrice;
    if (typeof input.quantityOnHand === 'number')
      update.quantityOnHand = input.quantityOnHand;
    if (typeof input.trackInventory === 'boolean')
      update.trackInventory = input.trackInventory;
    if (typeof input.isActive === 'boolean')
      update.isActive = input.isActive;

    if (input.taxRule !== undefined) {
      if (input.taxRule === null || input.taxRule === '') {
        update.taxRule = undefined;
      } else {
        const rule = await TaxRule.findOne({
          _id: input.taxRule,
          tenant: tenantId,
        });
        if (!rule) throw new Error('Invalid tax rule');
        update.taxRule = rule._id;
      }
    }

    return Product.findOneAndUpdate(
      { _id: id, tenant: tenantId },
      update,
      { new: true },
    ).populate('category taxRule');
  },

  async deleteProduct(tenantId: string, id: string) {
    return Product.findOneAndDelete({
      _id: id,
      tenant: tenantId,
    });
  },
};
