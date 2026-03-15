import { Types } from 'mongoose';

export type TaxType = 'STANDARD' | 'ZERO_RATED' | 'EXEMPT';

export interface ITaxRule {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  name: string;
  code: string;
  type: TaxType;
  rate: number;
  isDefault: boolean;
  isInclusive: boolean;   // add this
  createdAt: Date;
  updatedAt: Date;
}

