// src/controllers/tenantUserController.ts
import { Request, Response } from 'express';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { tenantUserService } from '../services/tenantUserService';
import { TenantRole } from '../constants/permissions';

export async function listTenantUsers(
  req: Request,
  res: Response,
) {
  try {
    const tReq = req as TenantRequest;
    const { tenantId } = tReq;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant not specified' });
    }

    const items = await tenantUserService.listTenantUsers(tenantId);
    return res.json(items);
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e.message || 'Failed to load team' });
  }
}

export async function updateTenantUserRoles(
  req: Request,
  res: Response,
) {
  try {
    const tReq = req as TenantRequest;
    const { tenantId } = tReq;
    const { userId, roles } = req.body as {
      userId?: string;
      roles?: TenantRole[];
    };

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant not specified' });
    }
    if (!userId || !Array.isArray(roles)) {
      return res
        .status(400)
        .json({ error: 'userId and roles are required' });
    }

    const updated = await tenantUserService.upsertTenantUser(
      tenantId,
      userId,
      roles,
    );
    return res.json(updated);
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e.message || 'Failed to update roles' });
  }
}

// NEW: add member

export async function addTenantUser(
  req: Request,
  res: Response,
) {
  try {
    const tReq = req as TenantRequest;
    const { tenantId } = tReq;
    const { name, email, role } = req.body as {
      name?: string;
      email?: string;
      role?: TenantRole;
    };

    console.log('ADD_TENANT_USER REQUEST', {
      tenantId,
      body: { name, email, role },
      authUserId: tReq.userId,
    });

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant not specified' });
    }
    if (!name || !email || !role) {
      return res
        .status(400)
        .json({ error: 'name, email and role are required' });
    }

    const { user, membership } = await tenantUserService.addTenantUser(
      tenantId,
      name,
      email,
      role,
    );

    console.log('ADD_TENANT_USER RESULT', {
      userId: user._id,
      userEmail: user.email,
      userStatus: user.status,
      inviteToken: user.inviteToken,
      membershipId: membership._id,
    });

    return res.status(201).json({ user, membership });
  } catch (e: any) {
    console.error('ADD_TENANT_USER ERROR', e);
    return res
      .status(500)
      .json({ error: e.message || 'Failed to add team member' });
  }
}
