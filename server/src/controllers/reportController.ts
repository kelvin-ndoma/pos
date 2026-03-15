// src/controllers/reportController.ts
import { Request, Response } from 'express';
import { reportService } from '../services/reportService';
import { TenantRequest } from '../middleware/tenantMiddleware';

export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const {
      fromDate,
      toDate,
      customerId,
      userId,
      productId,
      categoryId,
      groupBy,
    } = req.query as {
      fromDate?: string;
      toDate?: string;
      customerId?: string;
      userId?: string;
      productId?: string;
      categoryId?: string;
      groupBy?: 'DAY' | 'WEEK' | 'MONTH' | 'PRODUCT' | 'CATEGORY' | 'CUSTOMER' | 'USER';
    };

    const report = await reportService.getSalesReport(tenantId, {
      fromDate,
      toDate,
      customerId,
      userId,
      productId,
      categoryId,
      groupBy: groupBy || 'DAY',
    });

    return res.json(report);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to get sales report' });
  }
};

export const getInventoryReport = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const {
      categoryId,
      supplierId,
      lowStockOnly,
    } = req.query as {
      categoryId?: string;
      supplierId?: string;
      lowStockOnly?: string;
    };

    const report = await reportService.getInventoryReport(tenantId, {
      categoryId,
      supplierId,
      lowStockOnly: lowStockOnly === 'true',
    });

    return res.json(report);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to get inventory report' });
  }
};

export const downloadInventoryReportCsv = async (
  req: Request,
  res: Response,
) => {
  try {
    const { tenantId } = req as TenantRequest;

    const {
      categoryId,
      supplierId,
      lowStockOnly,
    } = req.query as {
      categoryId?: string;
      supplierId?: string;
      lowStockOnly?: string;
    };

    const report = await reportService.getInventoryReport(tenantId, {
      categoryId,
      supplierId,
      lowStockOnly: lowStockOnly === 'true',
    });

    const rows = report.items;

    // CSV headers
    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Quantity On Hand',
      'Reorder Level',
      'Cost Price',
      'Stock Value',
    ];

    const lines: string[] = [];
    lines.push(headers.join(','));

    for (const row of rows) {
      const name = (row.name || '').replace(/"/g, '""');
      const sku = (row.sku || '').replace(/"/g, '""');
      const categoryName =
        (row.category && (row.category as any).name) || '';
      const qty = row.quantityOnHand ?? 0;
      const reorder = row.reorderLevel ?? '';
      const cost = row.costPrice ?? 0;
      const value = row.stockValue ?? 0;

      lines.push(
        [
          `"${name}"`,
          `"${sku}"`,
          `"${categoryName}"`,
          qty,
          reorder,
          cost,
          value,
        ].join(','),
      );
    }

    const csv = lines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="inventory-report.csv"',
    );

    return res.status(200).send(csv);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to download inventory report' });
  }
};
