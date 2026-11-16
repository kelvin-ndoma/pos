// src/routes/v1/salesRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { validateBody } from '../../middleware/validationMiddleware';
import {
  listSales,
  getSale,
  createSale,
  updateSale,
  completeSale,
  voidSale,
} from '../../controllers/salesController';
import { PERMISSIONS } from '../../constants/permissions';
import {
  createSaleSchema,
  updateSaleSchema,
} from '../../validators/sale.validator';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// GET /api/v1/sales - List all sales
router.get(
  '/',
  requirePermission(PERMISSIONS.SALE_READ),
  listSales,
);

// GET /api/v1/sales/:id - Get single sale
router.get(
  '/:id',
  requirePermission(PERMISSIONS.SALE_READ),
  getSale,
);

// POST /api/v1/sales - Create new sale
router.post(
  '/',
  requirePermission(PERMISSIONS.SALE_CREATE),
  validateBody(createSaleSchema),
  createSale,
);

// PUT /api/v1/sales/:id - Full update
router.put(
  '/:id',
  requirePermission(PERMISSIONS.SALE_CREATE),
  validateBody(updateSaleSchema),
  updateSale,
);

// PATCH /api/v1/sales/:id - Partial update
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.SALE_CREATE),
  validateBody(updateSaleSchema),
  updateSale,
);

// POST /api/v1/sales/:id/complete - Complete payment
router.post(
  '/:id/complete',
  requirePermission(PERMISSIONS.SALE_CREATE),
  completeSale,
);

// POST /api/v1/sales/:id/void - Void sale
router.post(
  '/:id/void',
  requirePermission(PERMISSIONS.SALE_CREATE),
  voidSale,
);

export default router;