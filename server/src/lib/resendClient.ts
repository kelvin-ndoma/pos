// src/lib/resendClient.ts
import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY || '';

export const resend = new Resend(apiKey);

export const RESEND_FROM =
  process.env.RESEND_FROM_EMAIL || 'InventorySaaS <no-reply@example.com>';
