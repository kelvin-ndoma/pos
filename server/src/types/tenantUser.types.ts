// src/types/tenantUser.types.ts
import { Types } from 'mongoose';
import { TenantRole } from '../constants/permissions';

export interface ITenantUser {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  user: Types.ObjectId;
  roles: TenantRole[];     
  createdAt: Date;
  updatedAt: Date;
}
