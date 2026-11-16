// src/models/Table.ts
import { Schema, model, Model } from 'mongoose';
import { ITable } from '../types/table.types';

type TableModel = Model<ITable>;

const tableSchema = new Schema<ITable, TableModel>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    area: { type: String, trim: true },
    capacity: { type: Number },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'BLOCKED'],
      default: 'AVAILABLE',
      index: true,
    },
    currentSale: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
    },
  },
  { timestamps: true },
);

tableSchema.index({ tenant: 1, name: 1 }, { unique: true });

export const Table = model<ITable, TableModel>('Table', tableSchema);
