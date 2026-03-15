// src/routes/v1/supplierRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { validateBody, validateParams } from '../../middleware/validationMiddleware';
import {
  createSupplierSchema,
  updateSupplierSchema,
} from '../../validators/supplier.validator';
import {
  createSupplier,
  listSuppliers,
  getSupplier,
  updateSupplier,
} from '../../controllers/supplierController';
import { PERMISSIONS } from '../../constants/permissions';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.SUPPLIER_READ),
  listSuppliers,
);

const supplierIdParamsSchema = z.object({
  id: z.string(),
});

router.get(
  '/:id',
  requirePermission(PERMISSIONS.SUPPLIER_READ),
  validateParams(supplierIdParamsSchema),
  getSupplier,
);

router.post(
  '/',
  requirePermission(PERMISSIONS.SUPPLIER_CREATE),
  validateBody(createSupplierSchema),
  createSupplier,
);

router.put(
  '/:id',
  requirePermission(PERMISSIONS.SUPPLIER_UPDATE),
  validateParams(supplierIdParamsSchema),
  validateBody(updateSupplierSchema),
  updateSupplier,
);

export default router;
