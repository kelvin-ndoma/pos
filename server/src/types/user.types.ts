// src/types/user.types.ts
import { Types } from 'mongoose';

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

// Platform-level roles
export type PlatformRole =
  | 'PLATFORM_OWNER'
  | 'PLATFORM_ADMIN'
  | 'PLATFORM_SUPPORT'
  | 'NONE';

export interface IUser {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;     // ref Tenant
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  platformRole?: PlatformRole;     // <-- new
  inviteToken?: string | null;
  inviteExpiresAt?: Date | null;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
