// src/routes/v1/notificationRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { validateBody, validateParams } from '../../middleware/validationMiddleware';
import {
  listNotifications,
  markNotificationRead,
  createNotification,
} from '../../controllers/notificationController';
import { PERMISSIONS } from '../../constants/permissions';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// list notifications
router.get(
  '/',
  requirePermission(PERMISSIONS.NOTIFICATION_READ),
  listNotifications,
);

// params validator for :id
const notificationIdParamsSchema = z.object({
  id: z.string(),
});

// mark as read
router.patch(
  '/:id/read',
  validateParams(notificationIdParamsSchema),
  requirePermission(PERMISSIONS.NOTIFICATION_MANAGE),
  markNotificationRead,
);

// body validator for create
const createNotificationSchema = z.object({
  userId: z.string().optional(),
  title: z.string().min(1),
  message: z.string().min(1),
  channel: z.enum(['IN_APP', 'EMAIL', 'SMS']).optional(),
data: z.record(z.string(), z.any()).optional(),
});

router.post(
  '/',
  requirePermission(PERMISSIONS.NOTIFICATION_MANAGE),
  validateBody(createNotificationSchema),
  createNotification,
);

export default router;
