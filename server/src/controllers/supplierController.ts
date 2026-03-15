// src/controllers/supplierController.ts
import { Request, Response } from 'express';
import { supplierService } from '../services/supplierService';
import { TenantRequest } from '../middleware/tenantMiddleware';

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const supplier = await supplierService.createSupplier(tenantId, req.body);

    return res.status(201).json(supplier);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to create supplier' });
  }
};

export const listSuppliers = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const suppliers = await supplierService.listSuppliers(tenantId);

    return res.json(suppliers);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list suppliers' });
  }
};

export const getSupplier = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const supplier = await supplierService.getSupplierById(tenantId, id);

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    return res.json(supplier);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to fetch supplier' });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const supplier = await supplierService.updateSupplier(
      tenantId,
      id,
      req.body,
    );

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    return res.json(supplier);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to update supplier' });
  }
};
