// src/services/smsService.ts
export const smsService = {
  async sendSms(to: string, message: string) {
    // TODO: integrate with actual SMS provider
    console.log('SMS (stub):', { to, message });
  },
};
