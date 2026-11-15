import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import LoginPage from '@/pages/auth/LoginPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyOtpPage from '@/pages/auth/VerifyOtpPage';
import { ApiError } from '@/services/api';
import { createQueryClient } from '@/services/query';
import { useRecoveryStore } from '@/store';
import i18n from '@/translation/i18n';

vi.mock('@/services/auth/authApi', () => ({
  authApi: {
    requestPasswordRecovery: vi.fn(),
    verifyPasswordRecoveryOtp: vi.fn(),
    resetPassword: vi.fn(),
  },
}));
vi.mock('@/services/auth/authActions', () => ({ login: vi.fn() }));
import { authApi } from '@/services/auth/authApi';

const renderAt = (path: string) =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(async () => {
  vi.mocked(authApi.requestPasswordRecovery).mockReset();
  vi.mocked(authApi.verifyPasswordRecoveryOtp).mockReset();
  vi.mocked(authApi.resetPassword).mockReset();
  useRecoveryStore.getState().clear();
  await act(() => i18n.changeLanguage('en'));
});

describe('password recovery', () => {
  it('request → keeps only the phone and OTP expiry, shows the generic verify step', async () => {
    vi.mocked(authApi.requestPasswordRecovery).mockResolvedValue({ expiresInSeconds: 300 });
    renderAt('/forgot-password');
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '01012345678' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
    expect(await screen.findByText(/does not confirm that an account exists/)).toBeInTheDocument();
    expect(authApi.requestPasswordRecovery).toHaveBeenCalledWith({ phone: '01012345678' });
    const state = useRecoveryStore.getState();
    expect(state.phone).toBe('01012345678');
    expect(state.resetToken).toBeNull();
  });

  it('handles 429 with Retry-After on the request step', async () => {
    vi.mocked(authApi.requestPasswordRecovery).mockRejectedValue(
      new ApiError('rate_limited', { status: 429, code: 'RATE_LIMITED', retryAfterSeconds: 45 }),
    );
    renderAt('/forgot-password');
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '0101' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
    expect(await screen.findByText(/wait 45 seconds/)).toBeInTheDocument();
  });

  it('verify without a phone goes back to the request step', () => {
    renderAt('/verify-otp');
    expect(screen.getByRole('heading', { name: 'Forgot your password?' })).toBeInTheDocument();
  });

  it('shows the localized OTP_INVALID message', async () => {
    useRecoveryStore.getState().setRequested('0101', 300);
    vi.mocked(authApi.verifyPasswordRecoveryOtp).mockRejectedValue(
      new ApiError('validation', { status: 400, code: 'OTP_INVALID' }),
    );
    renderAt('/verify-otp');
    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify code' }));
    expect(await screen.findByText(/incorrect, expired or already used/)).toBeInTheDocument();
    expect(authApi.verifyPasswordRecoveryOtp).toHaveBeenCalledWith({ phone: '0101', otp: '123456' });
  });

  it('verify success stores the reset token in memory and opens the reset step', async () => {
    useRecoveryStore.getState().setRequested('0101', 300);
    vi.mocked(authApi.verifyPasswordRecoveryOtp).mockResolvedValue({ resetToken: 'RT', resetTokenExpiresAt: '2099-01-01T00:00:00.000Z' });
    renderAt('/verify-otp');
    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '٠١٢٣٤٥' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify code' }));
    expect(await screen.findByRole('heading', { name: 'Set a new password' })).toBeInTheDocument();
    expect(authApi.verifyPasswordRecoveryOtp).toHaveBeenCalledWith({ phone: '0101', otp: '012345' });
    expect(useRecoveryStore.getState().resetToken).toBe('RT');
  });

  it('reset without a token goes back to the start', () => {
    renderAt('/reset-password');
    expect(screen.getByRole('heading', { name: 'Forgot your password?' })).toBeInTheDocument();
  });

  it('reset sends only token + new password, clears temporary state and returns to sign-in', async () => {
    useRecoveryStore.getState().setRequested('0101', 300);
    useRecoveryStore.getState().setVerified('RT', '2099-01-01T00:00:00.000Z');
    vi.mocked(authApi.resetPassword).mockResolvedValue(undefined as never);
    renderAt('/reset-password');
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: '654321' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    await waitFor(() => expect(authApi.resetPassword).toHaveBeenCalledWith({ resetToken: 'RT', newPassword: '654321' }));
    expect(await screen.findByText(/Your password was changed/)).toBeInTheDocument();
    expect(useRecoveryStore.getState()).toMatchObject({ phone: '', resetToken: null, otpExpiresAt: null });
  });

  it('reset validates the confirmation locally', async () => {
    useRecoveryStore.getState().setVerified('RT', '2099-01-01T00:00:00.000Z');
    renderAt('/reset-password');
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: '654321' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });
});
