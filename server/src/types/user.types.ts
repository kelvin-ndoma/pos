// src/types/user.types.ts
import { Types } from 'mongoose';

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER';
export type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export interface IUser {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;     // ref Tenant
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
