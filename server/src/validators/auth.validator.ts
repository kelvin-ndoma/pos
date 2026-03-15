import { z } from 'zod';

export const registerTenantOwnerSchema = z.object({
  tenantName: z.string().min(2).max(100),
  tenantSlug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, alphanumeric and dashes only'),
  tenantEmail: z.string().email().optional(),
  tenantPhone: z.string().min(5).max(30).optional(),

  ownerName: z.string().min(2).max(100),
  ownerEmail: z.string().email(),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  tenantSlug: z.string().optional(), // if needed for multi-tenant login
});

export type RegisterTenantOwnerInput = z.infer<typeof registerTenantOwnerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
