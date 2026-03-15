// src/services/auditService.ts
import { AuditLog } from '../models';

export const auditService = {
  async log(
    tenantId: string,
    data: {
      userId?: string;
      action: string;
      entity: string;
      entityId?: string;
      metadata?: Record<string, any>;
      ip?: string;
      userAgent?: string;
    },
  ) {
    return AuditLog.create({
      tenant: tenantId,
      user: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      metadata: data.metadata,
      ip: data.ip,
      userAgent: data.userAgent,
    });
  },

  async listLogs(
    tenantId: string,
    limit = 100,
    filters: { userId?: string; entity?: string; action?: string } = {},
  ) {
    const query: any = { tenant: tenantId };

    if (filters.userId) query.user = filters.userId;
    if (filters.entity) query.entity = filters.entity;
    if (filters.action) query.action = filters.action;

    return AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  },
};
