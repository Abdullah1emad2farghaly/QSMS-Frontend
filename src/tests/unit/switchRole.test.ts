import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/api';

vi.mock('@/services/auth/authApi', () => ({
  authApi: {
    switchRole: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    logoutAll: vi.fn(),
    revokeSession: vi.fn(),
    listSessions: vi.fn(),
  },
}));

import { authApi } from '@/services/auth/authApi';
import { switchRole } from '@/services/auth/authActions';
import { applySession } from '@/services/auth/authSession';
import { readStoredSession } from '@/services/auth/tokenStorage';
import { queryClient, queryKeys } from '@/services/query';
import { useAuthStore } from '@/store';

const base = {
  tokenType: 'Bearer' as const,
  accessToken: 'acc-1',
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  refreshToken: 'ref-1',
  refreshTokenExpiresAt: '2099-02-01T00:00:00.000Z',
  user: { id: 'u1', phone: '0100' },
  mustChangePassword: false,
  roles: ['TEACHER', 'PARENT', 'STUDENT'] as never,
  activeRole: 'TEACHER' as never,
};

beforeEach(() => {
  window.localStorage.clear();
  queryClient.clear();
  Object.values(authApi).forEach((fn) => vi.mocked(fn).mockReset());
  applySession(base);
});

describe('switchRole', () => {
  it('does not call the API when the role is already active', async () => {
    await expect(switchRole('TEACHER')).resolves.toBe('TEACHER');
    expect(authApi.switchRole).not.toHaveBeenCalled();
  });

  it('never calls the API for a role the account does not have', async () => {
    await expect(switchRole('MAIN_ADMIN')).rejects.toBeInstanceOf(ApiError);
    expect(authApi.switchRole).not.toHaveBeenCalled();
  });

  it('sends { role } once and adopts the role confirmed by the backend, only for this session', async () => {
    vi.mocked(authApi.switchRole).mockResolvedValue({ activeRole: 'PARENT' });
    await expect(switchRole('PARENT')).resolves.toBe('PARENT');
    expect(authApi.switchRole).toHaveBeenCalledTimes(1);
    expect(authApi.switchRole).toHaveBeenCalledWith({ role: 'PARENT' });
    expect(useAuthStore.getState().activeRole).toBe('PARENT');
    expect(readStoredSession()?.activeRole).toBe('PARENT');
    // Tokens are untouched (the answer carried none) and the session stays authenticated.
    expect(useAuthStore.getState().accessToken).toBe('acc-1');
    expect(readStoredSession()?.refreshToken).toBe('ref-1');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('adopts the requested role when the answer has no body (HTTP 204) or no activeRole', async () => {
    vi.mocked(authApi.switchRole).mockResolvedValue(undefined);
    await switchRole('PARENT');
    expect(useAuthStore.getState().activeRole).toBe('PARENT');

    vi.mocked(authApi.switchRole).mockResolvedValue({} as never);
    await switchRole('TEACHER');
    expect(useAuthStore.getState().activeRole).toBe('TEACHER');
  });

  it('stores rotated tokens together if the answer happens to carry them', async () => {
    vi.mocked(authApi.switchRole).mockResolvedValue({
      activeRole: 'PARENT',
      accessToken: 'acc-2',
      refreshToken: 'ref-2',
      refreshTokenExpiresAt: '2099-03-01T00:00:00.000Z',
    });
    await switchRole('PARENT');
    expect(useAuthStore.getState().accessToken).toBe('acc-2');
    expect(readStoredSession()?.refreshToken).toBe('ref-2');
    expect(useAuthStore.getState().activeRole).toBe('PARENT');
  });

  it('removes role-scoped cached data but keeps public and account data (cache isolation)', async () => {
    vi.mocked(authApi.switchRole).mockResolvedValue({ activeRole: 'PARENT' });
    queryClient.setQueryData(queryKeys.role.scope('TEACHER', 'students'), [{ id: 1 }]);
    queryClient.setQueryData(queryKeys.geography.countries, [{ id: 'c1', name: 'مصر' }]);
    queryClient.setQueryData(queryKeys.auth.sessions, { maxActiveSessions: 3, items: [] });

    await switchRole('PARENT');

    expect(queryClient.getQueryData(queryKeys.role.scope('TEACHER', 'students'))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.geography.countries)).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.auth.sessions)).toBeDefined();
  });

  it('does not touch other sessions: no logout, revoke or refresh calls', async () => {
    vi.mocked(authApi.switchRole).mockResolvedValue({ activeRole: 'PARENT' });
    await switchRole('PARENT');
    expect(authApi.logout).not.toHaveBeenCalled();
    expect(authApi.logoutAll).not.toHaveBeenCalled();
    expect(authApi.revokeSession).not.toHaveBeenCalled();
    expect(authApi.refresh).not.toHaveBeenCalled();
  });

  it('a failed switch keeps the current role and the cached data', async () => {
    vi.mocked(authApi.switchRole).mockRejectedValue(new ApiError('forbidden', { status: 403, code: 'SOMETHING' }));
    queryClient.setQueryData(queryKeys.role.scope('TEACHER', 'students'), [1]);
    await expect(switchRole('PARENT')).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().activeRole).toBe('TEACHER');
    expect(queryClient.getQueryData(queryKeys.role.scope('TEACHER', 'students'))).toEqual([1]);
  });

  it('a user-level choice never survives sign-out: the next session starts without an active role', () => {
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().activeRole).toBeNull();
  });
});
