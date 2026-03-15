// src/routes/v1/reportRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import {
  getSalesReport,
  getInventoryReport,
  downloadInventoryReportCsv,
} from '../../controllers/reportController';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

// All report routes require auth + tenant
router.use(authMiddleware, tenantMiddleware);

// JSON APIs
router.get(
  '/sales',
  requirePermission(PERMISSIONS.SALE_READ),
  getSalesReport,
);

router.get(
  '/inventory',
  requirePermission(PERMISSIONS.INVENTORY_READ),
  getInventoryReport,
);

// CSV download: GET /api/v1/reports/inventory/download?lowStockOnly=true
router.get(
  '/inventory/download',
  requirePermission(PERMISSIONS.INVENTORY_READ),
  downloadInventoryReportCsv,
);

export default router;
