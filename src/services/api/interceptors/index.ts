import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/app/config';
import { usePreferencesStore } from '@/store/preferencesStore';
import {
  getAccessToken,
  notifyPasswordChangeRequired,
  notifyUnauthorized,
  requestTokenRefresh,
} from '@/services/auth/authBridge';
import { API_HEADERS, isSessionAuthErrorCode } from '@/types';
import { generateRequestId } from '@/utils/requestId';
import { logger } from '@/utils/logger';
import { ApiError, normalizeApiError } from '../errors';

/** 401 codes where a refresh can help (a revoked session cannot be recovered). */
const RECOVERABLE_CODES = new Set(['AUTHENTICATION_REQUIRED', 'ACCESS_TOKEN_INVALID', 'ACCESS_TOKEN_EXPIRED']);

/**
 * Refresh + retry once. Returns the retried response, or null when no recovery happened.
 * Concurrent 401s share ONE refresh (single-flight lives in the refresh handler); a request that
 * was sent with an older token than the current one is simply retried with the new token.
 */
async function recover(
  client: AxiosInstance,
  apiError: ApiError,
  config: InternalAxiosRequestConfig | undefined,
): Promise<{ response: AxiosResponse | null; outcome: string }> {
  if (!config || config.skipAuth || config.skipAuthRecovery || config.authRetried) {
    return { response: null, outcome: 'skipped' };
  }
  if (!RECOVERABLE_CODES.has(apiError.code ?? '')) return { response: null, outcome: 'skipped' };

  const current = getAccessToken();
  const used = config.headers?.get?.('Authorization');
  const alreadyRefreshed = Boolean(current) && used !== `Bearer ${current}`;

  if (!alreadyRefreshed) {
    const outcome = await requestTokenRefresh();
    if (outcome !== 'refreshed') return { response: null, outcome };
  }
  const response = await client.request({ ...config, authRetried: true });
  return { response, outcome: 'refreshed' };
}

export function registerInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use((config) => {
    if (!env.apiBaseUrl) throw new ApiError('misconfigured');

    config.headers.set(API_HEADERS.acceptLanguage, usePreferencesStore.getState().language);
    // Request tracing: keep a caller-provided id, otherwise generate one. The server echoes it.
    if (!config.headers.has(API_HEADERS.requestId)) {
      config.headers.set(API_HEADERS.requestId, generateRequestId());
    }
    if (!config.skipAuth) {
      const token = getAccessToken();
      if (token) config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      const apiError = normalizeApiError(error);
      const config = axios.isAxiosError(error) ? error.config : undefined;

      if (apiError.status === 401 && isSessionAuthErrorCode(apiError.code)) {
        const { response, outcome } = await recover(client, apiError, config);
        if (response) return response;
        // Unrecoverable: revoked session, no refresh handler, or the single retry was 401 again.
        if (apiError.code === 'SESSION_REVOKED' || outcome === 'unavailable' || config?.authRetried) {
          notifyUnauthorized(apiError);
        }
      } else if (apiError.status === 403 && apiError.code === 'PASSWORD_CHANGE_REQUIRED') {
        notifyPasswordChangeRequired(apiError);
      }

      logger.debug('API error', {
        kind: apiError.kind,
        status: apiError.status,
        code: apiError.code,
        requestId: apiError.requestId,
      });
      return Promise.reject(apiError);
    },
  );
}
