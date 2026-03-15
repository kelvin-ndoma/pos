// src/controllers/tenantController.ts
import { Request, Response } from 'express';
import { tenantService } from '../services/tenantService';

export const getTenant = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const tenant = await tenantService.getTenantById(id);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    return res.json(tenant);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch tenant' });
  }
};

export const listTenants = async (_req: Request, res: Response) => {
  try {
    const tenants = await tenantService.listTenants();
    return res.json(tenants);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list tenants' });
  }
};

export const updateTenant = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const tenant = await tenantService.updateTenant(id, req.body);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    return res.json(tenant);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to update tenant' });
  }
};
