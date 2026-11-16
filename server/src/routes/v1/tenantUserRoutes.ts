// src/routes/v1/tenantUserRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { PERMISSIONS } from '../../constants/permissions';
import {
  listTenantUsers,
  updateTenantUserRoles,
  addTenantUser,
} from '../../controllers/tenantUserController';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.USER_READ),
  listTenantUsers,
);

router.put(
  '/',
  requirePermission(PERMISSIONS.USER_MANAGE),
  updateTenantUserRoles,
);

router.post(
  '/',
  requirePermission(PERMISSIONS.USER_MANAGE),
  addTenantUser,
);

export default router;
