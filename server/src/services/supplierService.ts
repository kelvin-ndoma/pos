// src/services/supplierService.ts
import { Supplier } from '../models';

export const supplierService = {
  async createSupplier(tenantId: string, data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
    notes?: string;
  }) {
    return Supplier.create({
      tenant: tenantId,
      ...data,
      email: data.email?.toLowerCase(),
    });
  },

  async listSuppliers(tenantId: string) {
    return Supplier.find({ tenant: tenantId }).sort({ name: 1 });
  },

  async getSupplierById(tenantId: string, id: string) {
    return Supplier.findOne({ _id: id, tenant: tenantId });
  },

  async updateSupplier(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      address: string;
      contactPerson: string;
      notes: string;
    }>,
  ) {
    const update: any = { ...data };
    if (data.email) update.email = data.email.toLowerCase();
    return Supplier.findOneAndUpdate(
      { _id: id, tenant: tenantId },
      update,
      { new: true },
    );
  },
};
