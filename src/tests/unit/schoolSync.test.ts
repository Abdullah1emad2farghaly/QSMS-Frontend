import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '@/app/config';
import { switchRole } from '@/services/auth/authActions';
import { authApi } from '@/services/auth/authApi';
import { applySession, endSession, refreshSession } from '@/services/auth/authSession';
import { useAuthStore } from '@/store';
import type { AuthSessionData } from '@/types';

vi.mock('@/services/auth/authApi', () => ({
  authApi: { login: vi.fn(), refresh: vi.fn(), switchRole: vi.fn(), logout: vi.fn(), logoutAll: vi.fn() },
}));

const SCHOOL_A = '9a4e7c21-6d03-4b58-8e1f-0c2d5b7a3f64';
const SCHOOL_B = '1e9d4c7b-0a62-4b8f-9c35-d7f1a2b6e840';

const session = (n: number, extra: Record<string, unknown> = {}): AuthSessionData =>
  ({
    tokenType: 'Bearer',
    accessToken: `access-${n}`,
    accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
    refreshToken: `refresh-${n}`,
    refreshTokenExpiresAt: '2099-02-01T00:00:00.000Z',
    user: { id: 'u1', phone: '0100' },
    mustChangePassword: false,
    roles: ['SCHOOL_MANAGER', 'TEACHER'],
    ...extra,
  }) as AuthSessionData;

const managed = () => useAuthStore.getState().schoolId;
const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEYS.session) ?? '{}') as { schoolId?: string | null; activeRole?: string | null };

beforeEach(() => {
  vi.mocked(authApi.refresh).mockReset();
  vi.mocked(authApi.switchRole).mockReset();
  endSession(null);
  window.localStorage.clear();
});

describe('schoolId synchronization: token refresh / session restore', () => {
  beforeEach(() => applySession(session(1, { activeRole: 'SCHOOL_MANAGER', schoolId: SCHOOL_A })));

  it('adopts the schoolId of the refresh answer (the backend value wins)', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue(session(2, { activeRole: 'SCHOOL_MANAGER', schoolId: SCHOOL_B }));
    expect(await refreshSession()).toBe('refreshed');
    expect(managed()).toBe(SCHOOL_B);
    expect(stored().schoolId).toBe(SCHOOL_B);
  });

  it('stores null when the refresh answer has no schoolId (no fallback value)', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue(session(2, { activeRole: 'SCHOOL_MANAGER' }));
    await refreshSession();
    expect(managed()).toBeNull();
  });

  it('an explicit null from the backend clears it (module unavailable)', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue(session(2, { activeRole: 'SCHOOL_MANAGER', schoolId: null }));
    await refreshSession();
    expect(managed()).toBeNull();
    expect(stored().schoolId).toBeNull();
  });

  it('a refresh that reports another active role clears the managed school', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue(session(2, { activeRole: 'TEACHER', schoolId: null }));
    await refreshSession();
    expect(managed()).toBeNull();
  });
});

describe('schoolId synchronization: role switching', () => {
  it('switching away clears the managed school; switching back uses the id from the Switch Role answer', async () => {
    applySession(session(1, { activeRole: 'SCHOOL_MANAGER', schoolId: SCHOOL_A }));

    vi.mocked(authApi.switchRole).mockResolvedValue({ activeRole: 'TEACHER', schoolId: null });
    await switchRole('TEACHER');
    expect(managed()).toBeNull();
    expect(useAuthStore.getState().activeRole).toBe('TEACHER');

    vi.mocked(authApi.switchRole).mockResolvedValue({ activeRole: 'SCHOOL_MANAGER', schoolId: SCHOOL_B });
    await switchRole('SCHOOL_MANAGER');
    expect(managed()).toBe(SCHOOL_B);
    expect(stored()).toMatchObject({ activeRole: 'SCHOOL_MANAGER', schoolId: SCHOOL_B });
  });

  it('a switch answer with schoolId null leaves the module unavailable', async () => {
    applySession(session(1, { activeRole: 'TEACHER', schoolId: null }));
    vi.mocked(authApi.switchRole).mockResolvedValue({ activeRole: 'SCHOOL_MANAGER', schoolId: null });
    await switchRole('SCHOOL_MANAGER');
    expect(managed()).toBeNull();
  });

  it('a switch answer that carries a full session (rotated tokens) also applies its schoolId', async () => {
    applySession(session(1, { activeRole: 'TEACHER', schoolId: null }));
    vi.mocked(authApi.switchRole).mockResolvedValue(session(2, { activeRole: 'SCHOOL_MANAGER', schoolId: SCHOOL_A }));
    await switchRole('SCHOOL_MANAGER');
    expect(managed()).toBe(SCHOOL_A);
    expect(useAuthStore.getState().accessToken).toBe('access-2');
  });

  it('updates the role and the school together', async () => {
    applySession(session(1, { activeRole: 'SCHOOL_MANAGER', schoolId: SCHOOL_A }));
    const seen: Array<[string | null, string | null]> = [];
    const unsubscribe = useAuthStore.subscribe((s) => seen.push([s.activeRole, s.schoolId]));
    vi.mocked(authApi.switchRole).mockResolvedValue({ activeRole: 'TEACHER', schoolId: null });
    await switchRole('TEACHER');
    unsubscribe();
    expect(seen).toEqual([['TEACHER', null]]);
  });
});

describe('schoolId synchronization: cross-tab storage event', () => {
  it('follows a schoolId written by another tab of the same session', async () => {
    const { registerAuthIntegration } = await import('@/services/auth/registerAuth');
    applySession(session(1, { activeRole: 'SCHOOL_MANAGER', schoolId: SCHOOL_A }));
    registerAuthIntegration();
    window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ ...stored(), refreshToken: 'refresh-1', refreshTokenExpiresAt: '2099-02-01T00:00:00.000Z', user: { id: 'u1', phone: '0100' }, roles: ['SCHOOL_MANAGER', 'TEACHER'], mustChangePassword: false, schoolId: SCHOOL_B }));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEYS.session }));
    expect(managed()).toBe(SCHOOL_B);
  });
});
