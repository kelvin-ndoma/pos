// src/controllers/categoryController.ts
import { Request, Response } from 'express';
import { categoryService } from '../services/categoryService';
import { TenantRequest } from '../middleware/tenantMiddleware';

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const category = await categoryService.createCategory(tenantId, req.body);

    return res.status(201).json(category);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const category = await categoryService.updateCategory(
      tenantId,
      id,
      req.body,
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.json(category);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to update category' });
  }
};

export const listCategories = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const categories = await categoryService.listCategories(tenantId);

    return res.json(categories);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list categories' });
  }
};
