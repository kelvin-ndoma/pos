// src/routes/v1/purchaseRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { validateBody, validateParams } from '../../middleware/validationMiddleware';
import { createPurchaseSchema } from '../../validators/purchase.validator';
import {
  createPurchase,
  getPurchaseById,
  listPurchases,
} from '../../controllers/purchaseController';
import { PERMISSIONS } from '../../constants/permissions';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.PURCHASE_READ),
  listPurchases,
);

const purchaseIdParamsSchema = z.object({
  id: z.string(),
});

router.get(
  '/:id',
  requirePermission(PERMISSIONS.PURCHASE_READ),
  validateParams(purchaseIdParamsSchema),
  getPurchaseById,
);

router.post(
  '/',
  requirePermission(PERMISSIONS.PURCHASE_CREATE),
  validateBody(createPurchaseSchema),
  createPurchase,
);

export default router;
