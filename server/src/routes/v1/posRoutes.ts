// src/routes/v1/posRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { validateBody } from '../../middleware/validationMiddleware';
import {
  getPosContext,
  listRecentPosSales,
  createPosSale,
  getPosSale,
} from '../../controllers/posController';
import { PERMISSIONS } from '../../constants/permissions';
import { createSaleSchema } from '../../validators/sale.validator';

const router = Router();

// All POS routes require auth + tenant
router.use(authMiddleware, tenantMiddleware);

// GET /api/v1/pos/context
router.get(
  '/context',
  requirePermission(PERMISSIONS.SALE_READ),
  getPosContext,
);

// GET /api/v1/pos/sales
router.get(
  '/sales',
  requirePermission(PERMISSIONS.SALE_READ),
  listRecentPosSales,
);

// GET /api/v1/pos/sales/:id
router.get(
  '/sales/:id',
  requirePermission(PERMISSIONS.SALE_READ),
  getPosSale,
);

// POST /api/v1/pos/sales
router.post(
  '/sales',
  requirePermission(PERMISSIONS.SALE_CREATE),
  validateBody(createSaleSchema),
  createPosSale,
);

export default router;
