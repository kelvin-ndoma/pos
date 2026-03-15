// src/services/customerService.ts
import { Customer } from '../models';
import {
  getPaginationOptions,
  buildPaginatedResult,
  PaginatedResult,
} from '../utils/pagination';

interface ListCustomersQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
}

export const customerService = {
  async listCustomers(
    tenantId: string,
    query: ListCustomersQuery,
  ): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationOptions(query, {
      page: 1,
      limit: 20,
    });

    const filter: any = { tenant: tenantId };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(filter),
    ]);

    return buildPaginatedResult(items, total, { page, limit, skip });
  },

  async getCustomer(tenantId: string, id: string) {
    const customer = await Customer.findOne({ _id: id, tenant: tenantId });
    return customer;
  },

  async createCustomer(tenantId: string, data: any) {
    const customer = await Customer.create({
      ...data,
      tenant: tenantId,
    });
    return customer;
  },

  async updateCustomer(tenantId: string, id: string, data: any) {
    const customer = await Customer.findOneAndUpdate(
      { _id: id, tenant: tenantId },
      data,
      { new: true },
    );
    return customer;
  },

  async deleteCustomer(tenantId: string, id: string) {
    const customer = await Customer.findOneAndDelete({ _id: id, tenant: tenantId });
    return customer;
  },
};
