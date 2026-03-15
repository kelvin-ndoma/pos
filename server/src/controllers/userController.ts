// src/controllers/userController.ts
import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { TenantRequest } from '../middleware/tenantMiddleware';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const user = await userService.createUser(tenantId, req.body);

    return res.status(201).json(user);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to create user' });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const users = await userService.listUsers(tenantId);

    return res.json(users);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list users' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const id = req.params.id as string;

    const user = await userService.updateUser(tenantId, id, req.body);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to update user' });
  }
};
