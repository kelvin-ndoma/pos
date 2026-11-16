// src/routes/v1/tableRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { PERMISSIONS } from '../../constants/permissions';
import {
  listTables,
  createTable,
  updateTable,
} from '../../controllers/tableController';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// You can reuse SALE_READ/SALE_CREATE or define dedicated TABLE perms
router.get(
  '/',
  requirePermission(PERMISSIONS.SALE_READ),
  listTables,
);

router.post(
  '/',
  requirePermission(PERMISSIONS.SALE_CREATE),
  createTable,
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.SALE_CREATE),
  updateTable,
);

export default router;
