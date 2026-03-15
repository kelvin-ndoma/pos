import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { validateBody } from '../../middleware/validationMiddleware';
import {
  createTaxRuleSchema,
  updateTaxRuleSchema,
} from '../../validators/tax.validator';
import {
  createTaxRule,
  listTaxRules,
  updateTaxRule,
} from '../../controllers/taxController';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.TAX_READ),
  listTaxRules,
);

router.post(
  '/',
  requirePermission(PERMISSIONS.TAX_MANAGE),
  validateBody(createTaxRuleSchema),
  createTaxRule,
);

router.put(
  '/:id',
  requirePermission(PERMISSIONS.TAX_MANAGE),
  validateBody(updateTaxRuleSchema),
  updateTaxRule,
);

export default router;
