// src/routes/v1/platformRoutes.ts
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePlatformRole } from '../../middleware/platformRoleMiddleware';
import { Tenant } from '../../models/Tenant';

const router = Router();

router.use(authMiddleware);

// List tenants
router.get(
  '/tenants',
  requirePlatformRole(['PLATFORM_OWNER', 'PLATFORM_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenants = await Tenant.find().sort({ createdAt: -1 });
      res.json(tenants);
      return;
    } catch (err: any) {
      console.error('list tenants error', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  },
);

// Toggle isActive
router.patch(
  '/tenants/:id/status',
  requirePlatformRole(['PLATFORM_OWNER', 'PLATFORM_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body as { isActive: boolean };

      if (typeof isActive !== 'boolean') {
        res.status(400).json({ error: 'isActive (boolean) is required' });
        return;
      }

      const tenant = await Tenant.findByIdAndUpdate(
        id,
        { $set: { isActive } },
        { new: true },
      );

      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      res.json(tenant);
      return;
    } catch (err: any) {
      console.error('toggle tenant status error', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  },
);

export default router;
