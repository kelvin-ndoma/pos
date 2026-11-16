// src/routes/v1/authRoutes.ts
import { Router } from 'express';
import { validateBody } from '../../middleware/validationMiddleware';
import {
  registerTenantOwnerSchema,
  loginSchema,
  acceptInviteSchema,
} from '../../validators/auth.validator';
import {
  registerTenantOwner,
  login,
  acceptInvite,
} from '../../controllers/authController';

const router = Router();

console.log('Mounting authRoutes');

router.post(
  '/register',
  validateBody(registerTenantOwnerSchema),
  registerTenantOwner,
);

router.post('/login', validateBody(loginSchema), login);

router.post(
  '/accept-invite',
  validateBody(acceptInviteSchema),
  acceptInvite,
);

export default router;
