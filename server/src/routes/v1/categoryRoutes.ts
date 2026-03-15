import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { validateBody } from '../../middleware/validationMiddleware';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../../validators/category.validator';
import {
  createCategory,
  updateCategory,
  listCategories,
} from '../../controllers/categoryController';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.CATEGORY_READ),
  listCategories,
);

router.post(
  '/',
  requirePermission(PERMISSIONS.CATEGORY_CREATE),
  validateBody(createCategorySchema),
  createCategory,
);

router.put(
  '/:id',
  requirePermission(PERMISSIONS.CATEGORY_UPDATE),
  validateBody(updateCategorySchema),
  updateCategory,
);

export default router;
