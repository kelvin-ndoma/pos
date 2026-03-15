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
} from '../../controllers/salesController';
import { PERMISSIONS } from '../../constants/permissions';
import {
  createSaleSchema,
  updateSaleSchema,
} from '../../validators/sale.validator';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.SALE_READ),
  listSales,
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.SALE_READ),
  getSale,
);

router.post(
  '/',
  requirePermission(PERMISSIONS.SALE_CREATE),
  validateBody(createSaleSchema),
  createSale,
);

// For now, reuse SALE_CREATE for update/void, or drop permission if preferred
router.put(
  '/:id',
  requirePermission(PERMISSIONS.SALE_CREATE),
  validateBody(updateSaleSchema),
  updateSale,
);

export default router;
