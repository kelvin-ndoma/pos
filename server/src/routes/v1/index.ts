// src/routes/v1/index.ts
import { Router } from 'express';

import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import tenantRoutes from './tenantRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import customerRoutes from './customerRoutes';
import supplierRoutes from './supplierRoutes';
import saleRoutes from './salesRoutes';
import purchaseRoutes from './purchaseRoutes';
import taxRoutes from './taxRoutes';
import reportRoutes from './reportRoutes';
import posRoutes from './posRoutes';
import dashboardRoutes from './dashboardRoutes';
import tenantUserRoutes from './tenantUserRoutes';
import platformRoutes from './platformRoutes';
import kitchenRoutes from './kitchenRoutes';
import tableRoutes from './tableRoutes';
import inventoryRoutes from './inventoryRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tenants', tenantRoutes);
router.use('/products', productRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/pos', posRoutes);
router.use('/categories', categoryRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/sales', saleRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/tax', taxRoutes);
router.use('/reports', reportRoutes);
router.use('/tenant-users', tenantUserRoutes);
router.use('/platform', platformRoutes); // <-- new
router.use('/kitchen', kitchenRoutes);
router.use('/tables', tableRoutes);
router.use('/inventory', inventoryRoutes);





// export v1 router
export default router;
