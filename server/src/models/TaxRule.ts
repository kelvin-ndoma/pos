import { Schema, model, Model } from 'mongoose';
import { ITaxRule } from '../types/tax.types';

type TaxRuleModel = Model<ITaxRule>;

const taxRuleSchema = new Schema<ITaxRule, TaxRuleModel>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['STANDARD', 'ZERO_RATED', 'EXEMPT'],
      required: true,
    },
    rate: { type: Number, required: true },
    isDefault: { type: Boolean, default: false },
    isInclusive: { type: Boolean, default: false }, // add this
  },
  { timestamps: true },
);


taxRuleSchema.index({ tenant: 1, code: 1 }, { unique: true });

export const TaxRule = model<ITaxRule, TaxRuleModel>(
  'TaxRule',
  taxRuleSchema,
);
