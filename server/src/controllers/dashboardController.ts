// src/controllers/dashboardController.ts
import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';
import { TenantRequest } from '../middleware/tenantMiddleware';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const summary = await dashboardService.getSummary(tenantId);

    return res.json(summary);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to load dashboard summary' });
  }
};
