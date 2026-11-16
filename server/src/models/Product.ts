import { Schema, model, Model } from 'mongoose';
import { IProduct } from '../types/product.types';

type ProductModel = Model<IProduct>;

const productSchema = new Schema<IProduct, ProductModel>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    description: { type: String, trim: true },
    costPrice: { type: Number, required: true },
    // Net price (VAT-exclusive). Tax will be added on sale.
    salePrice: { type: Number, required: true },
    quantityOnHand: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 5 },
    taxRule: { type: Schema.Types.ObjectId, ref: 'TaxRule' },
    isActive: { type: Boolean, default: true },
    trackInventory: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ tenant: 1, sku: 1 }, { unique: true });
productSchema.index({ tenant: 1, name: 1 });

export const Product = model<IProduct, ProductModel>(
  'Product',
  productSchema,
);
