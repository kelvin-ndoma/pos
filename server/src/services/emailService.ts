// src/services/emailService.ts
import { resend, RESEND_FROM } from '../lib/resendClient';

export async function sendTenantInviteEmail(params: {
  to: string;
  name: string;
  tenantName: string;
  inviteUrl: string;
}) {
  const { to, name, tenantName, inviteUrl } = params;

  const { error } = await resend.emails.send({
    from: RESEND_FROM,
    to: [to],
    subject: `You're invited to ${tenantName} on InventorySaaS`,
    html: `
      <p>Hi ${name || ''},</p>
      <p>You have been invited to join <strong>${tenantName}</strong> on InventorySaaS.</p>
      <p>Click the button below to set your password and activate your account:</p>
      <p>
        <a href="${inviteUrl}"
           style="display:inline-block;padding:8px 14px;border-radius:4px;
                  background:#0f766e;color:#ffffff;text-decoration:none;font-size:14px;">
          Accept invite
        </a>
      </p>
      <p>If you did not expect this invite, you can ignore this email.</p>
    `,
  });

  if (error) {
    // log but don't crash the whole request
    console.error('Failed to send invite email', error);
  }
}
