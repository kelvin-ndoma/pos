// src/controllers/authController.ts
import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const registerTenantOwner = async (req: Request, res: Response) => {
  try {
    const result = await authService.registerTenantOwner(req.body);
    return res.status(201).json(result);
  } catch (error: any) {
    return res
      .status(400)
      .json({ error: error.message || 'Failed to register tenant owner' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    return res
      .status(401)
      .json({ error: error.message || 'Invalid credentials' });
  }
};
