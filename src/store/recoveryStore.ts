import { create } from 'zustand';

/**
 * Temporary state of the password-recovery workflow. Memory only: never persisted, never logged.
 * Cleared on success and when the flow is abandoned.
 */
interface RecoveryState {
  phone: string;
  /** Epoch ms when the requested OTP stops being valid (from `expiresInSeconds`). */
  otpExpiresAt: number | null;
  resetToken: string | null;
  resetTokenExpiresAt: string | null;
  setRequested: (phone: string, expiresInSeconds: number) => void;
  setVerified: (resetToken: string, resetTokenExpiresAt: string) => void;
  clear: () => void;
}

const empty = { phone: '', otpExpiresAt: null, resetToken: null, resetTokenExpiresAt: null };

export const useRecoveryStore = create<RecoveryState>()((set) => ({
  ...empty,
  setRequested: (phone, expiresInSeconds) =>
    set({ phone, otpExpiresAt: Date.now() + expiresInSeconds * 1000, resetToken: null, resetTokenExpiresAt: null }),
  setVerified: (resetToken, resetTokenExpiresAt) => set({ resetToken, resetTokenExpiresAt }),
  clear: () => set(empty),
}));
