import { Schema, model, Model } from 'mongoose';
import { ICategory } from '../types/product.types';

type CategoryModel = Model<ICategory>;

const categorySchema = new Schema<ICategory, CategoryModel>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ tenant: 1, slug: 1 }, { unique: true });

export const Category = model<ICategory, CategoryModel>('Category', categorySchema);
