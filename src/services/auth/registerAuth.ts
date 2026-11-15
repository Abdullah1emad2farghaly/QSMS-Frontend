import { setAccessDecider, type AccessDecider } from '@/app/guards/accessControl';
import { useAuthStore } from '@/store/authStore';
import { STORAGE_KEYS } from '@/app/config';
import { resolveActiveRole } from '@/utils/roles';
import {
  setAccessTokenProvider,
  setPasswordChangeRequiredHandler,
  setTokenRefreshHandler,
  setUnauthorizedHandler,
} from './authBridge';
import { endSession, markPasswordChangeRequired, refreshSession, restoreSession } from './authSession';
import { readStoredSession } from './tokenStorage';

/**
 * Route access: authentication is required for guarded groups. A role requirement is met only by the
 * ACTIVE role of this session (assigned-but-inactive roles do not open role pages).
 * Permissions are not modelled by the backend contract yet, so a permission requirement denies.
 */
export const authAccessDecider: AccessDecider = (access) => {
  const { status, roles, activeRole } = useAuthStore.getState();
  if (status !== 'authenticated') return false;
  if (access.permissions && access.permissions.length > 0) return false;
  if (access.roles && access.roles.length > 0) {
    const active = resolveActiveRole(roles, activeRole);
    return active !== null && access.roles.includes(active);
  }
  return true;
};

let registered = false;

/** Wires the auth module into the API layer and the route guard. Called once from `bootstrap()`. */
export function registerAuthIntegration(): void {
  if (registered) return;
  registered = true;

  setAccessTokenProvider(() => useAuthStore.getState().accessToken);
  setTokenRefreshHandler(refreshSession);
  setUnauthorizedHandler(() => endSession('expired'));
  setPasswordChangeRequiredHandler(() => markPasswordChangeRequired());

  setAccessDecider(authAccessDecider);

  // Another tab signed out (or changed the password flag): follow it.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEYS.session) return;
    const stored = readStoredSession();
    const store = useAuthStore.getState();
    if (!stored && store.status !== 'anonymous') {
      store.clear(null);
    } else if (stored && store.status === 'authenticated') {
      // Another tab of the same session changed the flag or switched the active role.
      if (stored.mustChangePassword !== store.mustChangePassword) store.setMustChangePassword(stored.mustChangePassword);
      if (stored.activeRole !== undefined && stored.activeRole !== store.activeRole) store.setActiveRole(stored.activeRole);
      if (stored.schoolId !== undefined && stored.schoolId !== store.schoolId) store.setSchoolId(stored.schoolId);
    }
  });

  void restoreSession();
}
