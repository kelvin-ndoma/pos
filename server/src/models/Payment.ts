import { Schema, model, Model } from 'mongoose';
import { IPayment } from '../types/payment.types';

type PaymentModel = Model<IPayment>;

const paymentSchema = new Schema<IPayment, PaymentModel>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    sale: { type: Schema.Types.ObjectId, ref: 'Sale' },
    reference: { type: String, trim: true },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ['CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'COMPLETED',
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

paymentSchema.index({ tenant: 1, createdAt: -1 });

export const Payment = model<IPayment, PaymentModel>('Payment', paymentSchema);
