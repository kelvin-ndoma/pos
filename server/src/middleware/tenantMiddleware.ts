// src/middleware/tenantMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from './authMiddleware';
import { Tenant, User } from '../models';
import { TenantUser } from '../models/TenantUser';
import { logger } from '../config/logger';
import {
  PermissionKey,
  PLATFORM_ROLE_PERMISSIONS,
  TENANT_ROLE_PERMISSIONS,
  TenantRole,
} from '../constants/permissions';

export interface TenantRequest extends AuthRequest {
  tenantId: string;
  tenantRoles?: TenantRole[];
  tenantPermissions?: PermissionKey[];
}

function isPlatformAdmin(platformRole?: string): boolean {
  return (
    platformRole === 'PLATFORM_OWNER' || platformRole === 'PLATFORM_ADMIN'
  );
}

export const tenantMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthRequest;
    // Tenant is resolved in authMiddleware (JWT home tenant, or platform override)
    const tenantId = authReq.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant not specified' });
    }

    const tenant = await Tenant.findById(tenantId).select('_id isActive');
    if (!tenant || !tenant.isActive) {
      return res
        .status(403)
        .json({ error: 'Tenant disabled or not found' });
    }

    const tReq = req as TenantRequest;
    tReq.tenantId = tenant.id;

    if (!authReq.userId) {
      tReq.tenantRoles = [];
      tReq.tenantPermissions = [];
      return next();
    }

    const membership = await TenantUser.findOne({
      tenant: tenant._id,
      user: authReq.userId,
    }).select('roles');

    let tenantRoles: TenantRole[] = [];

    if (membership?.roles?.length) {
      tenantRoles = membership.roles as TenantRole[];
    } else if (isPlatformAdmin(authReq.platformRole)) {
      // Platform admins may impersonate tenants without membership
      tenantRoles = ['OWNER'];
    } else {
      // Home-tenant fallback for owners created before TenantUser records existed
      const user = await User.findById(authReq.userId).select('tenant role');
      const isHomeTenant =
        user && user.tenant.toString() === tenantId && authReq.role;

      if (isHomeTenant) {
        tenantRoles = [authReq.role as TenantRole];
        await TenantUser.findOneAndUpdate(
          { tenant: tenant._id, user: authReq.userId },
          { $setOnInsert: { roles: tenantRoles } },
          { upsert: true },
        );
      } else {
        return res.status(403).json({ error: 'No access to this business' });
      }
    }

    tReq.tenantRoles = tenantRoles;

    const perms = new Set<PermissionKey>();
    tenantRoles.forEach((r) => {
      (TENANT_ROLE_PERMISSIONS[r] || []).forEach((p) => perms.add(p));
    });

    // Platform admins impersonating a tenant get full platform permissions too
    if (isPlatformAdmin(authReq.platformRole)) {
      (PLATFORM_ROLE_PERMISSIONS[authReq.platformRole!] || []).forEach((p) =>
        perms.add(p),
      );
    }

    tReq.tenantPermissions = Array.from(perms);

    return next();
  } catch (error) {
    logger.error('Tenant middleware error', { error });
    return res.status(500).json({ error: 'Tenant resolution failed' });
  }
};
