// src/routes/v1/tenantRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/roleMiddleware';
import {
  getTenant,
  listTenants,
  updateTenant,
} from '../../controllers/tenantController';

const router = Router();

router.use(authMiddleware, requireRole(['OWNER', 'ADMIN']));

router.get('/', listTenants);
router.get('/:id', getTenant);
router.put('/:id', updateTenant);

export default router;
