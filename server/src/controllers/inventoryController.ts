// src/controllers/inventoryController.ts
import { Request, Response } from 'express';
import { inventoryService } from '../services/inventoryService';
import { TenantRequest } from '../middleware/tenantMiddleware';

export const listInventory = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const items = await inventoryService.listInventory(tenantId);

    return res.json(items);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list inventory' });
  }
};

export const getInventoryForProduct = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const productId = req.params.productId as string;

    const inventory = await inventoryService.getInventoryForProduct(
      tenantId,
      productId,
    );

    if (!inventory) {
      return res
        .status(404)
        .json({ error: 'Inventory record not found for this product' });
    }

    return res.json(inventory);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch inventory' });
  }
};

// Manual adjustment endpoint (for admin UI / corrections)
export const adjustInventory = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const productId = req.params.productId as string;
    const { delta } = req.body as { delta: number };

    const inventory = await inventoryService.adjustInventory(
      tenantId,
      productId,
      delta,
    );

    return res.json(inventory);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to adjust inventory' });
  }
};
