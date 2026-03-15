// src/services/emailService.ts
import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: env.SMTP_USER
    ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      }
    : undefined,
});

export const emailService = {
  async sendMail(options: { to: string; subject: string; html: string }) {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      // in dev, you might just log
      return;
    }

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  },
};
