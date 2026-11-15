import { z } from 'zod';
import i18n from '@/translation/i18n';

const tv = (key: string) => i18n.t(key, { ns: 'validation' });

/** Documented limits: phone ≤ 40, login password ≤ 128, OTP ≤ 32, new password 4–12 characters. */
export const phoneField = z.string().trim().min(1).max(40);
export const loginPasswordField = z.string().min(1).max(128);
/** Policy for NEW passwords (change, reset, registration). */
export const newPasswordField = z.string().min(4).max(12);

export const loginSchema = z.object({ phone: phoneField, password: loginPasswordField });
export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ phone: phoneField });
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const verifyOtpSchema = z.object({ otp: z.string().trim().min(1).max(32) });
export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

/** Confirm password is frontend-only and is never sent to the API. */
export const resetPasswordSchema = z
  .object({ newPassword: newPasswordField, confirmPassword: z.string().min(1) })
  .superRefine((value, ctx) => {
    if (value.confirmPassword !== value.newPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: tv('passwordMismatch') });
    }
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: loginPasswordField,
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.confirmPassword !== value.newPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: tv('passwordMismatch') });
    }
    if (value.newPassword && value.newPassword === value.currentPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['newPassword'], message: tv('passwordSame') });
    }
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
