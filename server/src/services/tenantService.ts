// src/services/tenantService.ts
import { Tenant } from '../models';

export const tenantService = {
  async getTenantById(id: string) {
    return Tenant.findById(id);
  },

  async listTenants() {
    return Tenant.find().sort({ createdAt: -1 });
  },

  async updateTenant(id: string, data: Partial<{ name: string; email: string; phone: string; address: string; isActive: boolean }>) {
    return Tenant.findByIdAndUpdate(id, data, { new: true });
  },
};
