// src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { TenantUser } from '../models/TenantUser';
import { signJwt } from '../utils/jwt';

// REGISTER TENANT OWNER
export async function registerTenantOwner(req: Request, res: Response) {
  try {
    const {
      tenantName,
      tenantSlug,
      tenantEmail,
      tenantPhone,
      ownerName,
      ownerEmail,
      password,
    } = req.body;

    const existingTenant = await Tenant.findOne({ slug: tenantSlug });
    if (existingTenant) {
      return res.status(409).json({ error: 'Business slug already taken' });
    }

    const tenant = await Tenant.create({
      name: tenantName,
      slug: tenantSlug,
      email: tenantEmail,
      phone: tenantPhone,
    });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      tenant: tenant._id,
      name: ownerName,
      email: ownerEmail.toLowerCase(),
      passwordHash,
      role: 'OWNER',
      status: 'ACTIVE',
    });

    await TenantUser.create({
      tenant: tenant._id,
      user: user._id,
      roles: ['OWNER'],
    });

    const token = signJwt({
      userId: user._id.toString(),
      tenantId: tenant._id.toString(),
      role: user.role,
      platformRole: user.platformRole ?? 'NONE',
    });

    return res.status(201).json({
      accessToken: token,
      user: {
        id: user._id,
        tenant: tenant._id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
        platformRole: user.platformRole ?? 'NONE',
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
      },
    });
  } catch (err: any) {
    console.error('registerTenantOwner error', err);
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Business or email already exists' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// LOGIN
export async function login(req: Request, res: Response) {
  try {
    const { email, password, tenantSlug } = req.body as {
      email: string;
      password: string;
      tenantSlug?: string;
    };

    const query: any = { email: email.toLowerCase() };
    if (tenantSlug) {
      const tenant = await Tenant.findOne({ slug: tenantSlug }).select('_id');
      if (!tenant) {
        return res.status(400).json({ error: 'Tenant not found' });
      }
      query.tenant = tenant._id;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'User is not active' });
    }

    const token = signJwt({
      userId: user._id.toString(),
      tenantId: user.tenant.toString(),
      role: user.role,
      platformRole: user.platformRole ?? 'NONE',
    });

    return res.json({
      accessToken: token,
      user: {
        id: user._id,
        tenant: user.tenant,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
        platformRole: user.platformRole ?? 'NONE',
      },
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ACCEPT INVITE
export async function acceptInvite(req: Request, res: Response) {
  try {
    const { token, password } = req.body as {
      token: string;
      password: string;
    };

    console.log('ACCEPT_INVITE REQUEST', { token, hasPassword: !!password });

    if (!token || !password) {
      return res
        .status(400)
        .json({ error: 'Token and password are required' });
    }

    const user = await User.findOne({ inviteToken: token });

    console.log(
      'ACCEPT_INVITE USER_BEFORE',
      user && {
        id: user._id,
        email: user.email,
        status: user.status,
        inviteToken: user.inviteToken,
        inviteExpiresAt: user.inviteExpiresAt,
        updatedAt: user.updatedAt,
      },
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid invite token' });
    }

    if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Invite has expired' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    user.passwordHash = passwordHash;
    user.status = 'ACTIVE';
    user.inviteToken = null;
    user.inviteExpiresAt = null;
    await user.save();

    console.log('ACCEPT_INVITE USER_AFTER', {
      id: user._id,
      email: user.email,
      status: user.status,
      updatedAt: user.updatedAt,
    });

    const jwtToken = signJwt({
      userId: user._id.toString(),
      tenantId: user.tenant.toString(),
      role: user.role,
      platformRole: user.platformRole ?? 'NONE',
    });

    return res.json({
      accessToken: jwtToken,
      user: {
        id: user._id,
        tenant: user.tenant,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
        platformRole: user.platformRole ?? 'NONE',
      },
    });
  } catch (err) {
    console.error('acceptInvite error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
