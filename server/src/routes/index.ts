// src/routes/index.ts
import { Router } from 'express';
import v1Routes from './v1';

const router = Router();

// All v1 routes under /api/v1
router.use('/v1', v1Routes);

export default router;
