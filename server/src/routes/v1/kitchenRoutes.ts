import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { tenantMiddleware } from '../../middleware/tenantMiddleware';
import { requirePermission } from '../../middleware/permissionMiddleware';
import { PERMISSIONS } from '../../constants/permissions';
import { saleService } from '../../services/saleService';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// GET /api/v1/kitchen/orders
router.get('/orders', requirePermission(PERMISSIONS.SALE_READ), async (req: any, res) => {
  try {
    const tenantId = req.tenantId as string;
    const { status, type } = req.query as { status?: string; type?: string };

    const orders = await saleService.listKitchenOrders(tenantId, {
      status: (status as any) || 'ALL',
      type: (type as any) || 'ALL',
    });

    res.json({ data: orders });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to load kitchen orders' });
  }
});

// PATCH /api/v1/kitchen/orders/:id/status
router.patch(
  '/orders/:id/status',
  requirePermission(PERMISSIONS.SALE_CREATE),
  async (req: any, res) => {
    try {
      const tenantId = req.tenantId as string;
      const { id } = req.params;
      const { status } = req.body as { status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' };

      const sale = await saleService.updateKitchenStatus(tenantId, id, status);
      res.json(sale);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Failed to update kitchen status' });
    }
  },
);

export default router;