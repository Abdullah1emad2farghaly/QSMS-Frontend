import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function load() {
  vi.resetModules();
  vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
  const api = await import('@/services/api');
  const auth = await import('@/services/auth');
  const store = await import('@/store');
  return { ...api, ...auth, ...store };
}

let captured: InternalAxiosRequestConfig | undefined;

beforeEach(() => {
  captured = undefined;
});
afterEach(() => vi.unstubAllEnvs());

describe('request interceptor', () => {
  it('adds language, request id and bearer token; skipAuth omits the token', async () => {
    const m = await load();
    m.usePreferencesStore.setState({ language: 'en' });
    m.setAccessTokenProvider(() => 'tok');
    m.httpClient.defaults.adapter = async (config) => {
      captured = config;
      return { data: { success: true, data: {} }, status: 200, statusText: 'OK', headers: {}, config };
    };

    await m.request({ url: '/api/v1/x' });
    expect(captured?.headers.get('Accept-Language')).toBe('en');
    expect(captured?.headers.get('Authorization')).toBe('Bearer tok');
    expect(String(captured?.headers.get('X-Request-Id'))).toMatch(/^[A-Za-z0-9._-]{8,64}$/);

    await m.request({ url: '/api/v1/x', skipAuth: true });
    expect(captured?.headers.has('Authorization')).toBe(false);
  });
});

describe('response interceptor', () => {
  const failWith = (status: number, code: string) =>
    async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('x', 'ERR_BAD_REQUEST', config, undefined, {
        status,
        data: { success: false, error: { code, message: 'm', locale: 'en' } },
        headers: {},
        statusText: '',
        config,
      } as never);
    };

  it('notifies the unauthorized handler only for session 401 codes', async () => {
    const m = await load();
    const handler = vi.fn();
    m.setUnauthorizedHandler(handler);

    m.httpClient.defaults.adapter = failWith(401, 'INVALID_CREDENTIALS');
    await expect(m.request({ url: '/x' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(handler).not.toHaveBeenCalled();

    m.httpClient.defaults.adapter = failWith(401, 'ACCESS_TOKEN_EXPIRED');
    await expect(m.request({ url: '/x' })).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('notifies the password-change handler for 403 PASSWORD_CHANGE_REQUIRED', async () => {
    const m = await load();
    const handler = vi.fn();
    m.setPasswordChangeRequiredHandler(handler);
    m.httpClient.defaults.adapter = failWith(403, 'PASSWORD_CHANGE_REQUIRED');
    await expect(m.request({ url: '/x' })).rejects.toMatchObject({ kind: 'forbidden' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('fails fast as misconfigured when no base URL is set', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_API_BASE_URL', '');
    const { request } = await import('@/services/api');
    await expect(request({ url: '/x' })).rejects.toMatchObject({ kind: 'misconfigured' });
  });
});
