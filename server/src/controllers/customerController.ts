// src/controllers/customerController.ts
import { Request, Response } from 'express';
import { customerService } from '../services/customerService';
import { TenantRequest } from '../middleware/tenantMiddleware';

export const listCustomers = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const result = await customerService.listCustomers(tenantId, {
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
      search: req.query.search as string | undefined,
    });

    return res.json(result);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list customers' });
  }
};

export const getCustomer = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const customer = await customerService.getCustomer(tenantId, id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.json(customer);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch customer' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const customer = await customerService.createCustomer(tenantId, req.body);

    return res.status(201).json(customer);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to create customer' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const customer = await customerService.updateCustomer(tenantId, id, req.body);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.json(customer);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to update customer' });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const customer = await customerService.deleteCustomer(tenantId, id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.status(204).send();
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to delete customer' });
  }
};
