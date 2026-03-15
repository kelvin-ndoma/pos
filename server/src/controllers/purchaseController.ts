// src/controllers/purchaseController.ts
import { Request, Response } from 'express';
import { purchaseService } from '../services/purchaseService';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';

export const createPurchase = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const { user } = req as AuthRequest;

    if (!user?.userId) {
      return res
        .status(400)
        .json({ error: 'User not resolved from token' });
    }

    const input = {
      supplierId: req.body.supplierId as string | undefined,
      userId: user.userId,
      items: req.body.items as Array<{
        productId: string;
        quantity: number;
        unitCost: number;
        discountAmount?: number;
      }>,
      reference: req.body.reference as string | undefined,
      status: req.body.status as
        | 'DRAFT'
        | 'ORDERED'
        | 'RECEIVED'
        | 'CANCELLED'
        | undefined,
    };

    const result = await purchaseService.createPurchase(
      tenantId,
      input,
    );

    return res.status(201).json(result);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to create purchase' });
  }
};

export const getPurchaseById = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const purchase = await purchaseService.getPurchaseById(
      tenantId,
      id,
    );

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    return res.json(purchase);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch purchase' });
  }
};

export const listPurchases = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const result = await purchaseService.listPurchases(tenantId, {
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      supplierId: req.query.supplierId as string | undefined,
      userId: req.query.userId as string | undefined,
      status: req.query.status as
        | 'DRAFT'
        | 'ORDERED'
        | 'RECEIVED'
        | 'CANCELLED'
        | 'ALL'
        | undefined,
      search: req.query.search as string | undefined,
    });

    return res.json(result);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list purchases' });
  }
};
