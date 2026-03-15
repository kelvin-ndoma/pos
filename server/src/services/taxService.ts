// src/services/taxService.ts
import { TaxRule } from '../models';

export const taxService = {
  async createTaxRule(
    tenantId: string,
    data: {
      name: string;
      code: string;
      type: 'STANDARD' | 'ZERO_RATED' | 'EXEMPT';
      rate: number;
      isDefault?: boolean;
    },
  ) {
    const existing = await TaxRule.findOne({
      tenant: tenantId,
      code: data.code,
    });
    if (existing) throw new Error('Tax rule code already exists');

    return TaxRule.create({
      tenant: tenantId,
      name: data.name,
      code: data.code,
      type: data.type,
      rate: data.rate,
      isDefault: data.isDefault ?? false,
    });
  },

  async listTaxRules(tenantId: string) {
    return TaxRule.find({ tenant: tenantId }).sort({ name: 1 });
  },

  async updateTaxRule(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      code: string;
      type: 'STANDARD' | 'ZERO_RATED' | 'EXEMPT';
      rate: number;
      isDefault: boolean;
    }>,
  ) {
    return TaxRule.findOneAndUpdate(
      { _id: id, tenant: tenantId },
      data,
      { new: true },
    );
  },
};
