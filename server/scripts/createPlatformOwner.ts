// scripts/createPlatformOwner.ts
import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

import bcrypt from 'bcryptjs';
import { User } from '../src/models/User';
import { Tenant } from '../src/models/Tenant'; // adjust path

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const email = 'kelvinndomamutua@gmail.com';
  const plainPassword = 'ChangeMe123!'; // choose your password

  // 1) Ensure there is a tenant (use an existing one or create a platform tenant)
  let tenant = await Tenant.findOne({ slug: 'platform-hq' });

  if (!tenant) {
    tenant = await Tenant.create({
      name: 'Platform HQ',
      slug: 'platform-hq',
      isActive: true,
    });
    console.log('Created tenant:', tenant.name);
  }

  // 2) Hash password into passwordHash
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  // 3) Upsert user with required fields
  let user = await User.findOne({ email });

  if (!user) {
    user = new User({
      name: 'Kelvin Ndoma Mutua',
      email,
      passwordHash,          // required field in your schema
      tenant: tenant._id,    // required tenant ref
      status: 'ACTIVE',
      role: 'OWNER',         // tenant-level role
      platformRole: 'PLATFORM_OWNER',
    });

    await user.save();
    console.log('Created new platform owner user:', user.email);
  } else {
    user.platformRole = 'PLATFORM_OWNER';
    user.tenant = tenant._id;
    await user.save();
    console.log('Updated existing user to platform owner:', user.email);
  }

  console.log('Login email:', email);
  console.log('Login password:', plainPassword);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
