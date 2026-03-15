// src/routes/v1/productRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { validateBody, validateParams } from '../../middleware/validationMiddleware';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../controllers/productController';
import { PERMISSIONS } from '../../constants/permissions';
import { z } from 'zod';
import {
  createProductSchema,
  updateProductSchema,
} from '../../validators/product.validator';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

const productIdParamsSchema = z.object({
  id: z.string(),
});

// GET /products
router.get(
  '/',
  requirePermission(PERMISSIONS.PRODUCT_READ),
  listProducts,
);

// GET /products/:id
router.get(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCT_READ),
  validateParams(productIdParamsSchema),
  getProduct,
);

// POST /products
router.post(
  '/',
  requirePermission(PERMISSIONS.PRODUCT_CREATE),
  validateBody(createProductSchema),
  createProduct,
);

// PUT /products/:id
router.put(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCT_UPDATE),
  validateParams(productIdParamsSchema),
  validateBody(updateProductSchema),
  updateProduct,
);

// DELETE /products/:id
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCT_DELETE),
  validateParams(productIdParamsSchema),
  deleteProduct,
);

export default router;
