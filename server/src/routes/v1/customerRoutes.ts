// src/routes/v1/customerRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { validateBody, validateParams } from '../../middleware/validationMiddleware';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../../controllers/customerController';
import { PERMISSIONS } from '../../constants/permissions';
import { z } from 'zod';
import {
  createCustomerSchema,
  updateCustomerSchema,
} from '../../validators/customer.validator';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

const customerIdParamsSchema = z.object({
  id: z.string(),
});

// GET /customers
router.get(
  '/',
  requirePermission(PERMISSIONS.CUSTOMER_READ),
  listCustomers,
);

// GET /customers/:id
router.get(
  '/:id',
  requirePermission(PERMISSIONS.CUSTOMER_READ),
  validateParams(customerIdParamsSchema),
  getCustomer,
);

// POST /customers
router.post(
  '/',
  requirePermission(PERMISSIONS.CUSTOMER_CREATE),
  validateBody(createCustomerSchema),
  createCustomer,
);

// PUT /customers/:id
router.put(
  '/:id',
  requirePermission(PERMISSIONS.CUSTOMER_UPDATE),
  validateParams(customerIdParamsSchema),
  validateBody(updateCustomerSchema),
  updateCustomer,
);

// DELETE /customers/:id
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.CUSTOMER_DELETE),
  validateParams(customerIdParamsSchema),
  deleteCustomer,
);

export default router;
