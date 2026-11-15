import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/pages/auth/LoginPage';
import { ApiError } from '@/services/api';
import { createQueryClient } from '@/services/query';
import i18n from '@/translation/i18n';

vi.mock('@/services/auth/authActions', () => ({ login: vi.fn() }));
import { login } from '@/services/auth/authActions';

const loginData = (mustChangePassword: boolean, extra: Record<string, unknown> = {}) =>
  ({ mustChangePassword, roles: [], activeRole: null, ...extra }) as never;

const renderLogin = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/my-devices" element={<p>devices screen</p>} />
          <Route path="/change-password" element={<p>change password screen</p>} />
          <Route path="/select-role" element={<p>select role screen</p>} />
          <Route path="/teacher" element={<p>teacher landing</p>} />
          <Route path="/parent" element={<p>parent landing</p>} />
          <Route path="/forgot-password" element={<p>forgot screen</p>} />
          <Route path="/register" element={<p>register screen</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

const submit = (phone = '01012345678', password = '123456') => {
  fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: phone } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
};

beforeEach(async () => {
  vi.mocked(login).mockReset();
  await act(() => i18n.changeLanguage('en'));
});

describe('LoginPage', () => {
  it('validates required fields before calling the API', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
    expect(login).not.toHaveBeenCalled();
  });

  it('signs in and goes to the safe fallback', async () => {
    vi.mocked(login).mockResolvedValue(loginData(false));
    renderLogin();
    submit();
    await waitFor(() => expect(screen.getByText('devices screen')).toBeInTheDocument());
    expect(login).toHaveBeenCalledWith({ phone: '01012345678', password: '123456' });
  });

  it('redirects to change-password immediately when mustChangePassword is true', async () => {
    vi.mocked(login).mockResolvedValue(loginData(true));
    renderLogin();
    submit();
    await waitFor(() => expect(screen.getByText('change password screen')).toBeInTheDocument());
  });

  it('single-role account goes straight to that role landing page', async () => {
    vi.mocked(login).mockResolvedValue(loginData(false, { roles: ['TEACHER'], activeRole: 'TEACHER' }));
    renderLogin();
    submit();
    expect(await screen.findByText('teacher landing')).toBeInTheDocument();
  });

  it('multi-role account with an active role goes to that role landing page (no selection screen)', async () => {
    vi.mocked(login).mockResolvedValue(loginData(false, { roles: ['TEACHER', 'PARENT'], activeRole: 'PARENT' }));
    renderLogin();
    submit();
    expect(await screen.findByText('parent landing')).toBeInTheDocument();
  });

  it('multi-role account with no active role goes to role selection first', async () => {
    vi.mocked(login).mockResolvedValue(loginData(false, { roles: ['TEACHER', 'PARENT'], activeRole: null }));
    renderLogin();
    submit();
    expect(await screen.findByText('select role screen')).toBeInTheDocument();
  });

  it('a forced password change still wins over role handling', async () => {
    vi.mocked(login).mockResolvedValue(loginData(true, { roles: ['TEACHER', 'PARENT'], activeRole: null }));
    renderLogin();
    submit();
    expect(await screen.findByText('change password screen')).toBeInTheDocument();
  });

  it('shows localized feedback for INVALID_CREDENTIALS', async () => {
    vi.mocked(login).mockRejectedValue(new ApiError('unauthorized', { status: 401, code: 'INVALID_CREDENTIALS', serverMessage: 'raw' }));
    renderLogin();
    submit();
    expect(await screen.findByText('The phone number or password is incorrect.')).toBeInTheDocument();
  });

  it('shows the session limit with the maximum from the server details', async () => {
    vi.mocked(login).mockRejectedValue(
      new ApiError('business_rule', { status: 422, code: 'SESSION_LIMIT_REACHED', details: { maxActiveSessions: 3 } }),
    );
    renderLogin();
    submit();
    expect(await screen.findByText(/maximum of 3 devices/)).toBeInTheDocument();
  });

  it('honors Retry-After on 429 by disabling submit', async () => {
    vi.mocked(login).mockRejectedValue(new ApiError('rate_limited', { status: 429, code: 'RATE_LIMITED', retryAfterSeconds: 30 }));
    renderLogin();
    submit();
    expect(await screen.findByText(/wait 30 seconds/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });

  it('renders in Arabic (RTL copy)', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderLogin();
    expect(screen.getByRole('heading', { name: 'تسجيل الدخول' })).toBeInTheDocument();
  });
});
