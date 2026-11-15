import type { ApiError } from '@/services/api';

/**
 * Integration points between the API layer and the auth module (`services/auth`).
 * With nothing registered: no Authorization header, no refresh, no session handling.
 * The auth module registers its callbacks once at startup (`registerAuthIntegration`).
 */
type TokenProvider = () => string | null;
type ApiErrorHandler = (error: ApiError) => void;

/**
 * refreshed    new tokens are in place, the failed request may be retried;
 * ended        the refresh was refused for good and the local session was cleared;
 * failed       transient failure (e.g. offline); the session was kept;
 * unavailable  no refresh handler is registered.
 */
export type RefreshOutcome = 'refreshed' | 'ended' | 'failed' | 'unavailable';
type RefreshHandler = () => Promise<RefreshOutcome>;

let tokenProvider: TokenProvider = () => null;
let unauthorizedHandler: ApiErrorHandler | null = null;
let passwordChangeRequiredHandler: ApiErrorHandler | null = null;
let refreshHandler: RefreshHandler | null = null;

export const setAccessTokenProvider = (provider: TokenProvider): void => {
  tokenProvider = provider;
};
/** Called when the session is unusable and cannot be recovered (SESSION_REVOKED, or 401 after one retry). */
export const setUnauthorizedHandler = (handler: ApiErrorHandler | null): void => {
  unauthorizedHandler = handler;
};
/** Called for 403 `PASSWORD_CHANGE_REQUIRED` answers. */
export const setPasswordChangeRequiredHandler = (handler: ApiErrorHandler | null): void => {
  passwordChangeRequiredHandler = handler;
};
/** The single-flight token refresh used by the interceptor on 401. */
export const setTokenRefreshHandler = (handler: RefreshHandler | null): void => {
  refreshHandler = handler;
};

export const getAccessToken = (): string | null => tokenProvider();
export const notifyUnauthorized = (error: ApiError): void => unauthorizedHandler?.(error);
export const notifyPasswordChangeRequired = (error: ApiError): void => passwordChangeRequiredHandler?.(error);
export const requestTokenRefresh = (): Promise<RefreshOutcome> =>
  refreshHandler ? refreshHandler() : Promise.resolve('unavailable');
