// src/validators/product.validator.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  sku: z.string().min(1).max(100).optional(),   // <- now optional
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number().nonnegative(),
  salePrice: z.number().nonnegative(),
  quantityOnHand: z.number().optional(),
  trackInventory: z.boolean().optional(),
  isActive: z.boolean().optional(),
  taxRule: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
