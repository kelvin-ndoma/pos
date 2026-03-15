// src/controllers/productController.ts
import { Request, Response } from 'express';
import { productService } from '../services/productService';
import { TenantRequest } from '../middleware/tenantMiddleware';
import {
  CreateProductInput,
  UpdateProductInput,
} from '../validators/product.validator';

export const listProducts = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const result = await productService.listProducts(tenantId, {
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
      search: req.query.search as string | undefined,
      categoryId: req.query.categoryId as string | undefined,
      isActive: req.query.isActive as string | undefined,
    });

    return res.json(result);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list products' });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const product = await productService.getProduct(tenantId, id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch product' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const input = req.body as CreateProductInput;

    const product = await productService.createProduct(tenantId, input);

    return res.status(201).json(product);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const input = req.body as UpdateProductInput;

    const product = await productService.updateProduct(
      tenantId,
      id,
      input,
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const product = await productService.deleteProduct(tenantId, id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(204).send();
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to delete product' });
  }
};
