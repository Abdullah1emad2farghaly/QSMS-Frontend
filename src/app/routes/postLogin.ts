import type { UserRole } from '@/types';
import { needsRoleSelection, resolveActiveRole, roleHomePath } from '@/utils/roles';
import { POST_LOGIN_FALLBACK, ROUTES } from './paths';

const AUTH_SCREENS: string[] = [ROUTES.login, ROUTES.forgotPassword, ROUTES.verifyOtp, ROUTES.resetPassword, ROUTES.selectRole];

/** Reads a safe "return to" path from router state (only same-app paths that are not auth screens). */
export function getReturnPath(state: unknown): string | null {
  const from = (state as { from?: { pathname?: unknown; search?: unknown; hash?: unknown } } | null)?.from;
  if (!from || typeof from.pathname !== 'string' || !from.pathname.startsWith('/') || from.pathname.startsWith('//')) {
    return null;
  }
  if (AUTH_SCREENS.includes(from.pathname)) return null;
  return `${from.pathname}${typeof from.search === 'string' ? from.search : ''}${typeof from.hash === 'string' ? from.hash : ''}`;
}

export interface PostLoginAuth {
  mustChangePassword: boolean;
  roles: readonly UserRole[];
  activeRole?: UserRole | null;
}

/**
 * Where a signed-in user goes next, in this order:
 *  1. forced password change; 2. role selection (several roles, none active in this session);
 *  3. the location they were heading to; 4. the active role's landing page; 5. the safe fallback.
 */
export function resolvePostLoginPath(state: unknown, auth: PostLoginAuth): string {
  if (auth.mustChangePassword) return ROUTES.changePassword;
  if (needsRoleSelection(auth.roles, auth.activeRole)) return ROUTES.selectRole;
  return getReturnPath(state) ?? roleHomePath(resolveActiveRole(auth.roles, auth.activeRole)) ?? POST_LOGIN_FALLBACK;
}
