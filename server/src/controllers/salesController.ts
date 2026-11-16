// src/controllers/saleController.ts
import { Request, Response } from 'express';
import { saleService } from '../services/saleService';
import { TenantRequest } from '../middleware/tenantMiddleware';
import {
  CreateSaleInput,
  UpdateSaleInput,
} from '../validators/sale.validator';

export const listSales = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const result = await saleService.listSales(tenantId, {
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
      // date range (matches frontend query names)
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      // optional filters
      customerId: req.query.customerId as string | undefined,
      userId: req.query.userId as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    });

    // result should be: { data, page, limit, total, totalPages }
    return res.json(result);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list sales' });
  }
};

export const getSale = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const sale = await saleService.getSale(tenantId, id);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    return res.json(sale);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch sale' });
  }
};

export const createSale = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as TenantRequest;
    const userId = user?.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ error: 'User not resolved from token' });
    }

    // req.body has already been validated against createSaleSchema (zod)
    const body = req.body as CreateSaleInput;

    const sale = await saleService.createSale(tenantId, {
      ...body,
      userId,
      // body already includes:
      // customerId, items, paidAmount, reference, status,
      // type, tableId, covers, notes
    });

    return res.status(201).json(sale);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to create sale' });
  }
};

export const updateSale = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const body = req.body as UpdateSaleInput;

    const sale = await saleService.updateSale(tenantId, id, body);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    return res.json(sale);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to update sale' });
  }
};

/**
 * Complete a sale (mark as paid)
 * Dedicated endpoint for completing payment on an open order
 */
export const completeSale = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;
    const { paidAmount } = req.body;

    if (paidAmount === undefined || paidAmount === null) {
      return res.status(400).json({ error: 'paidAmount is required' });
    }

    if (typeof paidAmount !== 'number' || paidAmount < 0) {
      return res.status(400).json({ error: 'paidAmount must be a positive number' });
    }

    const sale = await saleService.updateSale(tenantId, id, {
      status: 'COMPLETED',
      paidAmount,
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    return res.json(sale);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to complete sale' });
  }
};

/**
 * Void a sale (cancel/refund)
 * Dedicated endpoint for voiding a sale
 */
export const voidSale = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const sale = await saleService.updateSale(tenantId, id, {
      status: 'VOID',
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    return res.json(sale);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to void sale' });
  }
};