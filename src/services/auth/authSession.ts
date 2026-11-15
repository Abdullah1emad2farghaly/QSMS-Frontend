import { useAuthStore, type SessionEndReason } from '@/store/authStore';
import { clearAuthenticatedCache } from '@/services/query';
import { hasErrorCode, isApiError } from '@/services/api';
import type { AuthSessionData, LandingRole, SwitchRoleData, UserRole } from '@/types';
import { isLandingRole } from '@/utils/roles';
import type { RefreshOutcome } from './authBridge';
import { authApi } from './authApi';
import { clearStoredSession, readStoredSession, writeStoredSession } from './tokenStorage';

/** Stores a fresh login/refresh result: persisted part and in-memory part are written in the same tick. */
export function applySession(data: AuthSessionData): void {
  writeStoredSession({
    refreshToken: data.refreshToken,
    refreshTokenExpiresAt: data.refreshTokenExpiresAt,
    user: data.user,
    roles: data.roles,
    mustChangePassword: data.mustChangePassword,
    activeRole: data.activeRole ?? null,
  });
  useAuthStore.getState().setSession({
    accessToken: data.accessToken,
    user: data.user,
    roles: data.roles,
    activeRole: data.activeRole ?? null,
    mustChangePassword: data.mustChangePassword,
  });
}

/**
 * Refresh result. Per the contract it repeats user/roles/mustChangePassword; if any is missing the
 * previously known value is kept (the frontend never invents profile data).
 */
function applyRefreshed(data: Partial<AuthSessionData> & Pick<AuthSessionData, 'accessToken' | 'refreshToken' | 'refreshTokenExpiresAt'>): void {
  const stored = readStoredSession();
  const store = useAuthStore.getState();
  const user = data.user ?? stored?.user ?? store.user;
  if (!user) {
    endSession('expired');
    return;
  }
  // The backend's active role for this session wins. Only when the answer omits the field (undefined)
  // is the last known value of THIS session kept; an explicit null means "none chosen".
  const activeRole: UserRole | null =
    data.activeRole !== undefined ? data.activeRole : (store.activeRole ?? stored?.activeRole ?? null);
  applySession({
    ...data,
    tokenType: 'Bearer',
    accessTokenExpiresAt: data.accessTokenExpiresAt ?? '',
    user,
    roles: data.roles ?? stored?.roles ?? store.roles,
    mustChangePassword: data.mustChangePassword ?? stored?.mustChangePassword ?? store.mustChangePassword,
    activeRole,
  } as AuthSessionData);
}

/** Sets this session's active role in memory and in the session's own stored mirror. */
export function setActiveRole(role: UserRole | null): void {
  useAuthStore.getState().setActiveRole(role);
  const stored = readStoredSession();
  if (stored) writeStoredSession({ ...stored, activeRole: role });
}

/**
 * Applies the answer of switch-role to THIS session only. The role confirmed by the backend wins;
 * if the answer names none, the requested role is adopted (the call succeeded). If the answer happens
 * to carry rotated tokens they are stored together (ignoring them would invalidate the next refresh).
 */
export function applySwitchRoleResult(data: SwitchRoleData | null | undefined, requested: LandingRole): LandingRole {
  const answer = (data && typeof data === 'object' ? data : {}) as SwitchRoleData;
  const confirmed = isLandingRole(answer.activeRole) ? answer.activeRole : requested;
  if (
    typeof answer.accessToken === 'string' &&
    typeof answer.refreshToken === 'string' &&
    typeof answer.refreshTokenExpiresAt === 'string'
  ) {
    applyRefreshed({ ...answer, accessToken: answer.accessToken, refreshToken: answer.refreshToken, refreshTokenExpiresAt: answer.refreshTokenExpiresAt, activeRole: confirmed });
  } else {
    setActiveRole(confirmed);
  }
  return confirmed;
}

/** Clears ONLY this device's local session and its user-specific caches. Never calls the API. */
export function endSession(reason: SessionEndReason = null): void {
  clearStoredSession();
  useAuthStore.getState().clear(reason);
  clearAuthenticatedCache();
}

export function markPasswordChangeRequired(): void {
  useAuthStore.getState().setMustChangePassword(true);
  const stored = readStoredSession();
  if (stored) writeStoredSession({ ...stored, mustChangePassword: true });
}

export function markPasswordChanged(): void {
  useAuthStore.getState().setMustChangePassword(false);
  const stored = readStoredSession();
  if (stored) writeStoredSession({ ...stored, mustChangePassword: false });
}

/** Refresh answers that mean "this session is over" (vs. transient failures such as being offline). */
const isDefinitiveRefusal = (error: unknown): boolean =>
  isApiError(error) &&
  (error.status === 401 || hasErrorCode(error, 'ACCOUNT_INACTIVE') || error.status === 400 || error.status === 403);

/** Cross-tab mutual exclusion: refresh tokens are single-use, two tabs must not use the same one. */
function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  return locks ? locks.request('qsms-token-refresh', task) : task();
}

async function performRefresh(): Promise<RefreshOutcome> {
  return withRefreshLock(async () => {
    // Read inside the lock: another tab may have rotated the token a moment ago.
    const stored = readStoredSession();
    if (!stored) {
      endSession('expired');
      return 'ended';
    }
    try {
      const data = await authApi.refresh({ refreshToken: stored.refreshToken });
      applyRefreshed(data);
      return 'refreshed';
    } catch (error) {
      if (isDefinitiveRefusal(error)) {
        // Only THIS device's session is dropped. Other devices are never touched.
        endSession('expired');
        return 'ended';
      }
      return 'failed';
    }
  });
}

let inflight: Promise<RefreshOutcome> | null = null;

/** Single-flight: every concurrent caller awaits the same refresh request. */
export function refreshSession(): Promise<RefreshOutcome> {
  if (!inflight) {
    inflight = performRefresh().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/** Startup: re-validate a stored session (the access token is memory-only, so it must be refreshed). */
export async function restoreSession(): Promise<void> {
  const store = useAuthStore.getState();
  if (store.status !== 'restoring') return;
  const outcome = await refreshSession();
  if (outcome === 'failed') {
    // Could not reach the server: do not claim an authenticated state, but keep the stored session for a retry.
    useAuthStore.getState().setStatus('anonymous');
  }
}
