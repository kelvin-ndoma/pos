// src/validators/taxRule.validator.ts
import { z } from 'zod';

export const createTaxRuleSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(1).max(50),                    // e.g. "VAT16"
  type: z.enum(['STANDARD', 'ZERO_RATED', 'EXEMPT']), // matches taxService
  rate: z.number().min(0).max(100),
  isDefault: z.boolean().optional(),
});

export const updateTaxRuleSchema = createTaxRuleSchema.partial();

export type CreateTaxRuleInput = z.infer<typeof createTaxRuleSchema>;
export type UpdateTaxRuleInput = z.infer<typeof updateTaxRuleSchema>;
