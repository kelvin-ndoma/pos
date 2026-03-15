// src/services/userService.ts
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { env } from '../config/env';

export const userService = {
  async createUser(tenantId: string, data: {
    name: string;
    email: string;
    password: string;
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER';
  }) {
    const existing = await User.findOne({
      tenant: tenantId,
      email: data.email.toLowerCase(),
    });
    if (existing) throw new Error('User email already exists for this tenant');

    const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
    const passwordHash = await bcrypt.hash(data.password, salt);

    return User.create({
      tenant: tenantId,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
    });
  },

  async listUsers(tenantId: string) {
    return User.find({ tenant: tenantId }).select('-passwordHash');
  },

  async updateUser(tenantId: string, userId: string, data: Partial<{ name: string; email: string; password: string; role: string; status: string }>) {
    const user = await User.findOne({ _id: userId, tenant: tenantId });
    if (!user) throw new Error('User not found');

    if (data.email) user.email = data.email.toLowerCase();
    if (data.name) user.name = data.name;
    if (data.role) user.role = data.role as any;
    if (data.status) user.status = data.status as any;
    if (data.password) {
      const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
      user.passwordHash = await bcrypt.hash(data.password, salt);
    }

    await user.save();
    return user;
  },
};
