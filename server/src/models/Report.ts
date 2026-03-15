import { Schema, model, Model } from 'mongoose';
import { IReport } from '../types/report.types';

type ReportModel = Model<IReport>;

const reportSchema = new Schema<IReport, ReportModel>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    type: { type: String, enum: ['SALES', 'PURCHASES', 'INVENTORY'], required: true },
    name: { type: String, required: true, trim: true },
    filters: { type: Schema.Types.Mixed, required: true },
    format: { type: String, enum: ['JSON', 'PDF', 'CSV'], default: 'PDF' },
    status: {
      type: String,
      enum: ['PENDING', 'GENERATING', 'READY', 'FAILED'],
      default: 'PENDING',
    },
    filePath: { type: String },
    errorMessage: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

reportSchema.index({ tenant: 1, type: 1, createdAt: -1 });

export const Report = model<IReport, ReportModel>('Report', reportSchema);
