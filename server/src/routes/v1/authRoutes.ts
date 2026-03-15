// src/routes/v1/authRoutes.ts
import { Router } from 'express';
import { validateBody } from '../../middleware/validationMiddleware';
import {
  registerTenantOwnerSchema,
  loginSchema,
} from '../../validators/auth.validator';
import { registerTenantOwner, login } from '../../controllers/authController';

const router = Router();

console.log('Mounting authRoutes'); // <— add this

router.post(
  '/register',
  validateBody(registerTenantOwnerSchema),
  registerTenantOwner,
);

router.post('/login', validateBody(loginSchema), login);

export default router;
