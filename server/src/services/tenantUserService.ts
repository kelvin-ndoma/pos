// src/services/tenantUserService.ts
import { Types } from 'mongoose';
import { TenantUser } from '../models/TenantUser';
import { User } from '../models/User';
import { TenantRole } from '../constants/permissions';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Tenant } from '../models/Tenant';
import { sendTenantInviteEmail } from './emailService';

export const tenantUserService = {
  async listTenantUsers(tenantId: string) {
    return TenantUser.find({ tenant: new Types.ObjectId(tenantId) })
      .populate('user', 'name email status')
      .sort({ createdAt: 1 });
  },

  async upsertTenantUser(
    tenantId: string,
    userId: string,
    roles: TenantRole[],
  ) {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const userObjectId = new Types.ObjectId(userId);

    const user = await User.findOne({
      _id: userObjectId,
      tenant: tenantObjectId,
    }).select('_id');

    if (!user) {
      throw new Error('User not found in this tenant');
    }

    const uniqueRoles = Array.from(new Set(roles));
    if (!uniqueRoles.length) {
      throw new Error('At least one role is required');
    }

    return TenantUser.findOneAndUpdate(
      { tenant: tenantObjectId, user: userObjectId },
      { $set: { roles: uniqueRoles } },
      { new: true, upsert: true },
    );
  },

  // Create or attach a user to this tenant with a role, and send invite email
 // src/services/tenantUserService.ts

async addTenantUser(
  tenantId: string,
  name: string,
  email: string,
  role: TenantRole,
) {
  const tenantObjectId = new Types.ObjectId(tenantId);

  const tenant = await Tenant.findById(tenantObjectId).select('name');
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3001';

  console.log('TENANT_USER_SERVICE addTenantUser INPUT', {
    tenantId,
    name,
    email: email.toLowerCase(),
    role,
  });

  let user = await User.findOne({
    tenant: tenantObjectId,
    email: email.toLowerCase(),
  });

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  if (!user) {
    const passwordHash = await bcrypt.hash(
      Math.random().toString(36).slice(2),
      10,
    );

    user = await User.create({
      tenant: tenantObjectId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      status: 'INVITED',
      inviteToken,
      inviteExpiresAt,
    });

    console.log('TENANT_USER_SERVICE CREATED_USER', {
      id: user._id,
      email: user.email,
      status: user.status,
      inviteToken: user.inviteToken,
    });
  } else {
    user.inviteToken = inviteToken;
    user.inviteExpiresAt = inviteExpiresAt;
    if (user.status !== 'ACTIVE') {
      user.status = 'INVITED';
    }
    await user.save();

    console.log('TENANT_USER_SERVICE UPDATED_USER', {
      id: user._id,
      email: user.email,
      status: user.status,
      inviteToken: user.inviteToken,
    });
  }

  const membership = await TenantUser.findOneAndUpdate(
    { tenant: tenantObjectId, user: user._id },
    { $setOnInsert: { roles: [role] } },
    { new: true, upsert: true },
  );

  const inviteUrl = `${appBaseUrl}/auth/accept-invite?token=${inviteToken}`;

  console.log('TENANT_USER_SERVICE INVITE_URL', {
    email: user.email,
    inviteUrl,
  });

  await sendTenantInviteEmail({
    to: user.email,
    name: user.name,
    tenantName: tenant.name,
    inviteUrl,
  });

  return { user, membership };
},

};
