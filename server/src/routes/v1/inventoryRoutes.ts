// src/routes/v1/inventoryRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { validateBody } from '../../middleware/validationMiddleware';
import {
  listInventory,
  getInventoryForProduct,
  adjustInventory,
} from '../../controllers/inventoryController';
import { PERMISSIONS } from '../../constants/permissions';
import { z } from 'zod';
import { validateParams } from '../../middleware/validationMiddleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.INVENTORY_READ),
  listInventory,
);

// params validator for productId
const productIdParamsSchema = z.object({
  productId: z.string(),
});

router.get(
  '/:productId',
  requirePermission(PERMISSIONS.INVENTORY_READ),
  validateParams(productIdParamsSchema),
  getInventoryForProduct,
);

// simple body validator for adjust
const adjustInventorySchema = z.object({
  delta: z.number(),
});

router.post(
  '/:productId/adjust',
  requirePermission(PERMISSIONS.INVENTORY_ADJUST),
  validateParams(productIdParamsSchema),
  validateBody(adjustInventorySchema),
  adjustInventory,
);

export default router;
