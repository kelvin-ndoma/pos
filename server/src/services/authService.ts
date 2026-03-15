// src/services/authService.ts
import bcrypt from 'bcryptjs';
import { Tenant, User } from '../models';
import { env } from '../config/env';
import { signJwt, JwtPayload } from '../utils/jwt';

export const authService = {
  async registerTenantOwner(input: {
    tenantName: string;
    tenantSlug: string;
    tenantEmail?: string;
    tenantPhone?: string;
    ownerName: string;
    ownerEmail: string;
    password: string;
  }) {
    const existingTenant = await Tenant.findOne({ slug: input.tenantSlug });
    if (existingTenant) {
      throw new Error('Tenant slug already in use');
    }

    const tenant = await Tenant.create({
      name: input.tenantName,
      slug: input.tenantSlug,
      email: input.tenantEmail,
      phone: input.tenantPhone,
    });

    const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await User.create({
      tenant: tenant._id,
      name: input.ownerName,
      email: input.ownerEmail,
      passwordHash,
      role: 'OWNER',
      status: 'ACTIVE',
    });

    const payload: JwtPayload = {
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
    };

    const accessToken = signJwt(payload);
    // later: add refresh token

    return { tenant, user, accessToken };
  },

  async login(input: { email: string; password: string; tenantSlug?: string }) {
    const tenant = input.tenantSlug
      ? await Tenant.findOne({ slug: input.tenantSlug, isActive: true })
      : null;

    const userQuery: any = { email: input.email.toLowerCase() };
    if (tenant) {
      userQuery.tenant = tenant._id;
    }

    const user = await User.findOne(userQuery).select('+passwordHash');
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const payload: JwtPayload = {
      userId: user.id,
      tenantId: user.tenant.toString(),
      role: user.role,
    };

    const accessToken = signJwt(payload);

    user.lastLoginAt = new Date();
    await user.save();

    return { user, accessToken };
  },
};
