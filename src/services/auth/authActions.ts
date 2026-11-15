import { hasErrorCode, isApiError } from '@/services/api';
import { isSessionAuthErrorCode } from '@/types';
import type { ChangePasswordRequest, LandingRole, LoginRequest } from '@/types';
import { clearRoleScopedCache } from '@/services/query';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/services/api';
import { getAvailableRoles, resolveActiveRole } from '@/utils/roles';
import { logger } from '@/utils/logger';
import { authApi } from './authApi';
import { applySession, applySwitchRoleResult, endSession, markPasswordChanged } from './authSession';

/** Workflows that combine an API call with local session state. */

export async function login(credentials: LoginRequest) {
  const data = await authApi.login(credentials);
  applySession(data);
  return data;
}

/**
 * Revokes the current session, then always clears the local one. If the server could not be reached
 * the local state is still cleared (the user must never be trapped); the server session then simply
 * expires on its own.
 */
export async function logout(): Promise<void> {
  try {
    await authApi.logout();
  } catch (error) {
    logger.debug('Logout request failed; clearing the local session anyway', isApiError(error) ? error.code : error);
  } finally {
    endSession(null);
  }
}

/** Signs out every device. The local session is cleared only after the server confirmed (or the session was already dead). */
export async function logoutAll(): Promise<void> {
  try {
    await authApi.logoutAll();
  } catch (error) {
    if (isApiError(error) && error.status === 401 && isSessionAuthErrorCode(error.code)) {
      endSession(null);
      return;
    }
    throw error;
  }
  endSession(null);
}

export async function changePassword(body: ChangePasswordRequest): Promise<void> {
  await authApi.changePassword(body);
  // The current session stays valid and no tokens are returned: only the local flag changes.
  markPasswordChanged();
}

/** Revokes one session. Revoking the current device ends the local session; others leave it untouched. */
export async function revokeSession(sessionId: string, isCurrent: boolean): Promise<void> {
  try {
    await authApi.revokeSession(sessionId);
  } catch (error) {
    // Already gone: the goal is reached, the caller just refreshes the list.
    if (!hasErrorCode(error, 'SESSION_NOT_FOUND')) throw error;
  }
  if (isCurrent) endSession(null);
}

/**
 * Activates `role` for THIS session. No request when it is already active or not assigned to the
 * account. Role-scoped cached data is cancelled and removed so the previous role's data cannot show.
 * Other sessions/devices are never touched (the backend call is session-scoped).
 */
export async function switchRole(role: LandingRole): Promise<LandingRole> {
  const { roles, activeRole } = useAuthStore.getState();
  if (resolveActiveRole(roles, activeRole) === role) return role;
  if (!getAvailableRoles(roles).includes(role)) throw new ApiError('forbidden');

  const data = await authApi.switchRole({ role });
  const confirmed = applySwitchRoleResult(data, role);
  clearRoleScopedCache();
  return confirmed;
}
