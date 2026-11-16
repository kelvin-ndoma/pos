// src/validators/sale.validator.ts
import { z } from 'zod';

export const saleItemInputSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().positive(),
  // Optional: if omitted, backend uses Product.salePrice
  unitPrice: z.number().nonnegative().optional(),
  // Discount applied BEFORE tax, per line
  discountAmount: z.number().nonnegative().optional(),
});

export const createSaleSchema = z.object({
  customerId: z.string().min(1).optional(),
  items: z
    .array(saleItemInputSchema)
    .min(1, 'At least one item is required'),
  paidAmount: z.number().nonnegative(),
  reference: z.string().max(100).optional(),
  status: z.enum(['OPEN', 'COMPLETED', 'VOID']).optional(),

  // Restaurant fields
  type: z
    .enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY'])
    .default('TAKEAWAY'),
  tableId: z.string().min(1).optional(),
  covers: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const updateSaleSchema = createSaleSchema.partial();

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
