// src/controllers/posController.ts
import { Request, Response } from 'express';
import { saleService } from '../services/saleService';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { TenantRequest } from '../middleware/tenantMiddleware';

// Extend TenantRequest to include userId from authMiddleware
type AuthedTenantRequest = TenantRequest & { userId?: string };

// Load POS context: products, customers, recent sales
export const getPosContext = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const [products, customers, sales] = await Promise.all([
      productService.listProducts(tenantId, {
        page: req.query.productPage as string | undefined,
        limit: req.query.productLimit as string | undefined,
        search: req.query.productSearch as string | undefined,
      }),
      customerService.listCustomers(tenantId, {
        page: req.query.customerPage as string | undefined,
        limit: req.query.customerLimit as string | undefined,
        search: req.query.customerSearch as string | undefined,
      }),
      saleService.listSales(tenantId, {
        page: req.query.salePage as string | undefined,
        limit: req.query.saleLimit as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        customerId: req.query.customerId as string | undefined,
        userId: req.query.userId as string | undefined,
        status: req.query.status as string | undefined,
        search: req.query.search as string | undefined,
      }),
    ]);

    return res.json({ products, customers, sales });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to load POS context' });
  }
};

// List recent POS sales
export const listRecentPosSales = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const result = await saleService.listSales(tenantId, {
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      customerId: req.query.customerId as string | undefined,
      userId: req.query.userId as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    });

    return res.json(result);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list POS sales' });
  }
};

// Create POS sale
export const createPosSale = async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req as AuthedTenantRequest;

    // Hard guard: if auth middleware didn't set userId, don't proceed
    if (!userId) {
      return res
        .status(400)
        .json({ error: 'User is required to create a sale' });
    }

    const sale = await saleService.createSale(tenantId, {
      ...req.body,
      userId, // inject authenticated user, ignore any userId in body
    });

    return res.status(201).json(sale);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to create POS sale' });
  }
};

// Get POS sale receipt
export const getPosSale = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const sale = await saleService.getSale(tenantId, id);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    return res.json(sale);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch POS sale' });
  }
};
