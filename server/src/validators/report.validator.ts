import { z } from 'zod';

// Option 1: accept YYYY-MM-DD as string
const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .optional();

export const baseReportFilterSchema = z
  .object({
    fromDate: isoDateString,
    toDate: isoDateString,
    customerId: z.string().optional(),
    supplierId: z.string().optional(),
    productId: z.string().optional(),
    categoryId: z.string().optional(),
    userId: z.string().optional(), // cashier / salesperson
  })
  .refine(
    (data) => {
      if (!data.fromDate || !data.toDate) return true;
      return data.toDate >= data.fromDate;
    },
    {
      message: 'toDate must be on or after fromDate',
      path: ['toDate'],
    },
  );

export const salesReportFilterSchema = baseReportFilterSchema.extend({
  groupBy: z
    .enum(['DAY', 'WEEK', 'MONTH', 'PRODUCT', 'CATEGORY', 'CUSTOMER', 'USER'])
    .default('DAY'),
});

export const purchaseReportFilterSchema = baseReportFilterSchema.extend({
  groupBy: z
    .enum(['DAY', 'WEEK', 'MONTH', 'PRODUCT', 'CATEGORY', 'SUPPLIER', 'USER'])
    .default('DAY'),
});

export const inventoryReportFilterSchema = z.object({
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  lowStockOnly: z.boolean().optional().default(false),
});

export type SalesReportFilterInput = z.infer<typeof salesReportFilterSchema>;
export type PurchaseReportFilterInput = z.infer<typeof purchaseReportFilterSchema>;
export type InventoryReportFilterInput = z.infer<typeof inventoryReportFilterSchema>;
