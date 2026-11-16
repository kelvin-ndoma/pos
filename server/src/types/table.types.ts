// src/types/table.types.ts
import { Types } from 'mongoose';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED';

export interface ITable {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  name: string;           // e.g. "T1", "Booth 3"
  area?: string;          // e.g. "Main", "Terrace"
  capacity?: number;
  status: TableStatus;
  currentSale?: Types.ObjectId; // open sale/tab
  createdAt: Date;
  updatedAt: Date;
}
