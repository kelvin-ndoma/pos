// src/controllers/taxController.ts
import { Request, Response } from 'express';
import { taxService } from '../services/taxService';
import { TenantRequest } from '../middleware/tenantMiddleware';

export const createTaxRule = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const taxRule = await taxService.createTaxRule(tenantId, req.body);

    return res.status(201).json(taxRule);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to create tax rule' });
  }
};

export const listTaxRules = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const rules = await taxService.listTaxRules(tenantId);

    return res.json(rules);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list tax rules' });
  }
};

export const updateTaxRule = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const rule = await taxService.updateTaxRule(tenantId, id, req.body);

    if (!rule) {
      return res.status(404).json({ error: 'Tax rule not found' });
    }

    return res.json(rule);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to update tax rule' });
  }
};
