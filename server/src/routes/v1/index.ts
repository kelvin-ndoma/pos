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


// add any others you have, e.g. inventoryRoutes, auditRoutes, etc.

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

// export v1 router
export default router;
