// src/models/User.ts
import { Schema, model, Model } from 'mongoose';
import { IUser } from '../types/user.types';

type UserModel = Model<IUser>;

const userSchema = new Schema<IUser, UserModel>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'],
      default: 'OWNER',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INVITED', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ tenant: 1, email: 1 }, { unique: true });

export const User = model<IUser, UserModel>('User', userSchema);
