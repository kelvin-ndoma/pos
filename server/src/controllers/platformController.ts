// src/controllers/platformController.ts
import { Request, Response } from 'express';
import { Tenant } from '../models/Tenant';

export async function listAllTenants(_req: Request, res: Response) {
  try {
    const tenants = await Tenant.find({})
      .select('_id name slug isActive createdAt');
    return res.json(tenants);
  } catch (err) {
    console.error('listAllTenants error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
