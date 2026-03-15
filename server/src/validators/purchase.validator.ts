import { z } from 'zod';

const purchaseItemInputSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().optional().default(0),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().optional(),
  items: z.array(purchaseItemInputSchema).min(1),
  reference: z.string().max(100).optional(),
  status: z.enum(['DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED']).optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemInputSchema>;
