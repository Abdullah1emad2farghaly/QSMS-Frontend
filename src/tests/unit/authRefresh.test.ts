import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const session = (n: number, extra: Record<string, unknown> = {}) => ({
  tokenType: 'Bearer',
  accessToken: `access-${n}`,
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  refreshToken: `refresh-${n}`,
  refreshTokenExpiresAt: '2099-02-01T00:00:00.000Z',
  user: { id: 'u1', phone: '0100' },
  mustChangePassword: false,
  roles: [],
  ...extra,
});

const ok = (config: InternalAxiosRequestConfig, data: unknown, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config,
});
const fail = (config: InternalAxiosRequestConfig, status: number, code: string) =>
  new AxiosError('x', 'ERR_BAD_REQUEST', config, undefined, {
    status,
    data: { success: false, error: { code, message: 'm', locale: 'en' } },
    headers: {},
    statusText: '',
    config,
  } as never);

async function setup() {
  vi.resetModules();
  vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
  window.localStorage.clear();
  const api = await import('@/services/api');
  const bridge = await import('@/services/auth/authBridge');
  const sessionMod = await import('@/services/auth/authSession');
  const { registerAuthIntegration } = await import('@/services/auth/registerAuth');
  const store = await import('@/store');
  const storage = await import('@/services/auth/tokenStorage');
  registerAuthIntegration();
  sessionMod.applySession(session(1) as never);
  return { ...api, ...bridge, ...sessionMod, ...store, ...storage };
}

beforeEach(() => vi.unstubAllEnvs());
afterEach(() => vi.unstubAllEnvs());

describe('single-flight token refresh', () => {
  it('sends ONE refresh for concurrent 401s, replaces both tokens atomically and retries each request once', async () => {
    const m = await setup();
    const calls: { url?: string; auth?: string }[] = [];
    let refreshCalls = 0;

    m.httpClient.defaults.adapter = async (config) => {
      const auth = String(config.headers.get('Authorization') ?? '');
      calls.push({ url: config.url, auth });
      if (config.url?.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        // The body carries the single-use refresh token of the stored session.
        expect(JSON.parse(String(config.data))).toEqual({ refreshToken: 'refresh-1' });
        await new Promise((r) => setTimeout(r, 10));
        return ok(config, { success: true, data: session(2) });
      }
      if (auth === 'Bearer access-1') throw fail(config, 401, 'ACCESS_TOKEN_EXPIRED');
      return ok(config, { success: true, data: { echoed: config.url } });
    };

    const results = await Promise.all([m.request({ url: '/a' }), m.request({ url: '/b' }), m.request({ url: '/c' })]);

    expect(refreshCalls).toBe(1);
    expect(results).toHaveLength(3);
    // Each original request ran twice at most: first attempt + exactly one retry.
    for (const url of ['/a', '/b', '/c']) {
      expect(calls.filter((c) => c.url === url)).toHaveLength(2);
    }
    // Both tokens replaced together (memory + storage), refresh token rotated.
    expect(m.useAuthStore.getState().accessToken).toBe('access-2');
    expect(m.readStoredSession()?.refreshToken).toBe('refresh-2');
  });

  it('does not loop: a second 401 after the retry ends the session instead of refreshing again', async () => {
    const m = await setup();
    let refreshCalls = 0;
    m.httpClient.defaults.adapter = async (config) => {
      if (config.url?.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return ok(config, { success: true, data: session(2) });
      }
      throw fail(config, 401, 'ACCESS_TOKEN_INVALID');
    };
    await expect(m.request({ url: '/a' })).rejects.toMatchObject({ status: 401 });
    expect(refreshCalls).toBe(1);
    expect(m.useAuthStore.getState().status).toBe('anonymous');
    expect(m.readStoredSession()).toBeNull();
  });

  it('clears only the local session when the refresh token is rejected (expired or reused)', async () => {
    const m = await setup();
    m.httpClient.defaults.adapter = async (config) => {
      if (config.url?.endsWith('/auth/refresh')) throw fail(config, 401, 'REFRESH_TOKEN_REUSED');
      throw fail(config, 401, 'ACCESS_TOKEN_EXPIRED');
    };
    const paths: string[] = [];
    const original = m.httpClient.defaults.adapter!;
    m.httpClient.defaults.adapter = async (config) => {
      paths.push(String(config.url));
      return (original as (c: InternalAxiosRequestConfig) => Promise<unknown>)(config) as never;
    };

    await expect(m.request({ url: '/a' })).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(m.useAuthStore.getState().status).toBe('anonymous');
    expect(m.useAuthStore.getState().endedReason).toBe('expired');
    // Never calls logout-all or any other revoking endpoint as a side effect.
    expect(paths.some((p) => p.includes('logout') || p.includes('/sessions'))).toBe(false);
  });

  it('keeps the session when the refresh fails for a transient reason (offline)', async () => {
    const m = await setup();
    m.httpClient.defaults.adapter = async (config) => {
      if (config.url?.endsWith('/auth/refresh')) throw new AxiosError('offline', 'ERR_NETWORK', config);
      throw fail(config, 401, 'ACCESS_TOKEN_EXPIRED');
    };
    await expect(m.request({ url: '/a' })).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(m.readStoredSession()?.refreshToken).toBe('refresh-1');
    expect(m.useAuthStore.getState().status).toBe('authenticated');
  });

  it('retries without a second refresh when the token was already renewed meanwhile', async () => {
    const m = await setup();
    let refreshCalls = 0;
    m.httpClient.defaults.adapter = async (config) => {
      if (config.url?.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return ok(config, { success: true, data: session(2) });
      }
      const auth = String(config.headers.get('Authorization') ?? '');
      if (auth === 'Bearer access-1') {
        // Simulates a slow request sent with the OLD token that fails after the refresh finished.
        await m.refreshSession();
        throw fail(config, 401, 'ACCESS_TOKEN_EXPIRED');
      }
      return ok(config, { success: true, data: {} });
    };
    await m.request({ url: '/a' });
    expect(refreshCalls).toBe(1);
  });

  it('refresh tolerates a response without user/roles (keeps the known profile)', async () => {
    const m = await setup();
    const { user: _u, roles: _r, mustChangePassword: _m, ...tokensOnly } = session(2);
    m.httpClient.defaults.adapter = async (config) => ok(config, { success: true, data: tokensOnly });
    expect(await m.refreshSession()).toBe('refreshed');
    expect(m.useAuthStore.getState().user).toEqual({ id: 'u1', phone: '0100' });
    expect(m.useAuthStore.getState().accessToken).toBe('access-2');
  });

  it('restores the session active role from the refresh answer (the backend value wins)', async () => {
    const m = await setup();
    m.httpClient.defaults.adapter = async (config) =>
      ok(config, { success: true, data: session(2, { roles: ['TEACHER', 'PARENT'], activeRole: 'PARENT' }) });
    await m.refreshSession();
    expect(m.useAuthStore.getState().activeRole).toBe('PARENT');
    expect(m.readStoredSession()?.activeRole).toBe('PARENT');
  });

  it('keeps this session\'s last active role when a refresh answer omits the field, and honors an explicit null', async () => {
    const m = await setup();
    m.setActiveRole('TEACHER');
    const { activeRole: _a, ...withoutRole } = session(2, { roles: ['TEACHER', 'PARENT'] }) as Record<string, unknown>;
    m.httpClient.defaults.adapter = async (config) => ok(config, { success: true, data: withoutRole });
    await m.refreshSession();
    expect(m.useAuthStore.getState().activeRole).toBe('TEACHER');

    m.httpClient.defaults.adapter = async (config) =>
      ok(config, { success: true, data: session(3, { roles: ['TEACHER', 'PARENT'], activeRole: null }) });
    await m.refreshSession();
    expect(m.useAuthStore.getState().activeRole).toBeNull();
  });

  it('login responses never leave the access token in storage', async () => {
    await setup();
    const raw = window.localStorage.getItem('qsms.session') ?? '';
    expect(raw).toContain('refresh-1');
    expect(raw).not.toContain('access-1');
  });
});
