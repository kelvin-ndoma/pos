// src/controllers/auditController.ts
import { Request, Response } from 'express';
import { auditService } from '../services/auditService';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';

export const listAuditLogs = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const { user } = req as AuthRequest;

    const limit = Number(req.query.limit || 100);
    const userId = (req.query.userId as string) || undefined;
    const entity = (req.query.entity as string) || undefined;
    const action = (req.query.action as string) || undefined;

    const logs = await auditService.listLogs(tenantId, limit, {
      userId,
      entity,
      action,
    });

    return res.json(logs);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list audit logs' });
  }
};
