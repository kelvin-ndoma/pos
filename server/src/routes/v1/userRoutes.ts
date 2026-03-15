// src/routes/v1/userRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { validateBody, validateParams } from '../../middleware/validationMiddleware';
import {
  createUserSchema,
  updateUserSchema,
} from '../../validators/user.validator';
import {
  createUser,
  listUsers,
  updateUser,
} from '../../controllers/userController';
import { PERMISSIONS } from '../../constants/permissions';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.USER_READ),
  listUsers,
);

const userIdParamsSchema = z.object({
  id: z.string(),
});

router.post(
  '/',
  requirePermission(PERMISSIONS.USER_MANAGE),
  validateBody(createUserSchema),
  createUser,
);

router.put(
  '/:id',
  requirePermission(PERMISSIONS.USER_MANAGE),
  validateParams(userIdParamsSchema),
  validateBody(updateUserSchema),
  updateUser,
);

export default router;
