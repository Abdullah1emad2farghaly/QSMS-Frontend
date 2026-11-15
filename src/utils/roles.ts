import { ROLE_ROUTES } from '@/app/routes/paths';
import { LANDING_ROLES, type LandingRole, type UserRole } from '@/types/roles';

export const isLandingRole = (role: unknown): role is LandingRole =>
  typeof role === 'string' && (LANDING_ROLES as readonly string[]).includes(role);

/** Roles the backend assigned to this user that the web app has a destination for (backend order, no duplicates). */
export function getAvailableRoles(roles: readonly UserRole[]): LandingRole[] {
  return [...new Set(roles.filter(isLandingRole))];
}

/**
 * The role to treat as active for THIS session:
 *  - the backend's `activeRole` when it is one of the assigned roles;
 *  - otherwise the only available role (single-role accounts need no choice);
 *  - otherwise none: the user has to choose (`needsRoleSelection`).
 */
export function resolveActiveRole(roles: readonly UserRole[], activeRole: UserRole | null | undefined): LandingRole | null {
  const available = getAvailableRoles(roles);
  if (isLandingRole(activeRole) && available.includes(activeRole)) return activeRole;
  return available.length === 1 ? available[0]! : null;
}

export const needsRoleSelection = (roles: readonly UserRole[], activeRole: UserRole | null | undefined): boolean =>
  getAvailableRoles(roles).length > 1 && resolveActiveRole(roles, activeRole) === null;

export const roleHomePath = (role: LandingRole | null): string | null => (role ? ROLE_ROUTES[role] : null);
