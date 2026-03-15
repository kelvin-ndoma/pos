import { Types } from 'mongoose';

export type ReportType = 'SALES' | 'PURCHASES' | 'INVENTORY';

export interface IReport {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  type: ReportType;
  name: string;
  filters: Record<string, any>;
  format: 'JSON' | 'PDF' | 'CSV';
  status: 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';
  filePath?: string;        // where the generated file is stored
  errorMessage?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
