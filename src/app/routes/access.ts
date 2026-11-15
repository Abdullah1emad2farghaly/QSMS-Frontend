import type { UserRole } from '@/types';

/**
 * Access requirements of a protected route group. Authentication is implied by the group being
 * protected at all. `roles` = the ACTIVE role of the session must be one of them; `permissions` = all of. The decision itself comes from the
 * future auth/permission module (see `setAccessDecider`); the backend stays the real authority.
 */
export interface RouteAccess {
  roles?: readonly UserRole[];
  permissions?: readonly string[];
}
