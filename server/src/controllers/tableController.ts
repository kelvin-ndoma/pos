// src/controllers/tableController.ts
import { Request, Response } from 'express';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { Table } from '../models';

export const listTables = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 100);
    const skip = (page - 1) * limit;

    const filter: any = { tenant: tenantId };

    if (req.query.area) {
      filter.area = req.query.area;
    }

    if (req.query.search) {
      const q = String(req.query.search).trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [{ name: regex }, { area: regex }];
    }

    const [data, total] = await Promise.all([
      Table.find(filter)
        .sort({ area: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      Table.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({ data, page, limit, total, totalPages });
  } catch (error: any) {
    console.error('listTables error', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to list tables' });
  }
};

export const createTable = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const { name, area, capacity, status } = req.body as {
      name: string;
      area?: string;
      capacity?: number;
      status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED';
    };

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    const table = await Table.create({
      tenant: tenantId,
      name: name.trim(),
      area: area?.trim() || undefined,
      capacity: typeof capacity === 'number' ? capacity : undefined,
      status: status || 'AVAILABLE',
    });

    return res.status(201).json(table);
  } catch (error: any) {
    console.error('createTable error', error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: 'A table with this name already exists' });
    }
    return res
      .status(500)
      .json({ error: error.message || 'Failed to create table' });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as TenantRequest;
    const { id } = req.params;
    const { name, area, capacity, status, currentSale } = req.body as {
      name?: string;
      area?: string;
      capacity?: number;
      status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED';
      currentSale?: string | null;
    };

    const update: any = {};
    if (typeof name === 'string') update.name = name.trim();
    if (typeof area === 'string') update.area = area.trim();
    if (typeof capacity === 'number') update.capacity = capacity;
    if (status) update.status = status;
    if (currentSale !== undefined) update.currentSale = currentSale;

    const table = await Table.findOneAndUpdate(
      { _id: id, tenant: tenantId },
      update,
      { new: true },
    );

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    return res.json(table);
  } catch (error: any) {
    console.error('updateTable error', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to update table' });
  }
};
