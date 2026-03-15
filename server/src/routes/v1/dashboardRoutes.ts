// src/routes/v1/dashboardRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { PERMISSIONS } from '../../constants/permissions';
import { getDashboardSummary } from '../../controllers/dashboardController';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  '/summary',
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  getDashboardSummary,
);

export default router;
