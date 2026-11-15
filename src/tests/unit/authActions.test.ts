import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/api';

vi.mock('@/services/auth/authApi', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    logoutAll: vi.fn(),
    changePassword: vi.fn(),
    revokeSession: vi.fn(),
  },
}));

import { authApi } from '@/services/auth/authApi';
import { changePassword, login, logout, logoutAll, revokeSession } from '@/services/auth/authActions';
import { readStoredSession } from '@/services/auth/tokenStorage';
import { useAuthStore } from '@/store';

const loginData = (mustChangePassword = false) => ({
  tokenType: 'Bearer' as const,
  accessToken: 'acc',
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  refreshToken: 'ref',
  refreshTokenExpiresAt: '2099-02-01T00:00:00.000Z',
  user: { id: 'u1', phone: '0100' },
  mustChangePassword,
  roles: [],
});

beforeEach(async () => {
  window.localStorage.clear();
  useAuthStore.getState().clear();
  vi.mocked(authApi.login).mockResolvedValue(loginData());
  vi.mocked(authApi.logout).mockResolvedValue(undefined as never);
  vi.mocked(authApi.logoutAll).mockResolvedValue(undefined as never);
  vi.mocked(authApi.changePassword).mockResolvedValue(undefined as never);
  vi.mocked(authApi.revokeSession).mockResolvedValue(undefined as never);
  await login({ phone: '0100', password: 'x' });
});

describe('auth actions', () => {
  it('login stores the session: access token in memory, refresh token persisted', () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.accessToken).toBe('acc');
    expect(readStoredSession()?.refreshToken).toBe('ref');
  });

  it('logout clears local state and cached auth data even if the request fails', async () => {
    vi.mocked(authApi.logout).mockRejectedValue(new ApiError('network'));
    await logout();
    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(readStoredSession()).toBeNull();
  });

  it('logout-all clears local state only after the server confirmed', async () => {
    vi.mocked(authApi.logoutAll).mockRejectedValue(new ApiError('server', { status: 500 }));
    await expect(logoutAll()).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().status).toBe('authenticated');

    vi.mocked(authApi.logoutAll).mockResolvedValue(undefined as never);
    await logoutAll();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('logout-all on an already dead session still ends the local session', async () => {
    vi.mocked(authApi.logoutAll).mockRejectedValue(new ApiError('unauthorized', { status: 401, code: 'ACCESS_TOKEN_EXPIRED' }));
    await logoutAll();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('change password keeps the session and clears the forced-change flag', async () => {
    useAuthStore.setState({ mustChangePassword: true });
    await changePassword({ currentPassword: 'a', newPassword: 'b' });
    expect(authApi.changePassword).toHaveBeenCalledWith({ currentPassword: 'a', newPassword: 'b' });
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().mustChangePassword).toBe(false);
    expect(readStoredSession()?.mustChangePassword).toBe(false);
  });

  it('revoking another device keeps this device signed in', async () => {
    await revokeSession('s2', false);
    expect(authApi.revokeSession).toHaveBeenCalledWith('s2');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('revoking the current device ends the local session', async () => {
    await revokeSession('s1', true);
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('an already-gone session (404) is treated as revoked', async () => {
    vi.mocked(authApi.revokeSession).mockRejectedValue(new ApiError('not_found', { status: 404, code: 'SESSION_NOT_FOUND' }));
    await expect(revokeSession('s9', false)).resolves.toBeUndefined();
  });
});
