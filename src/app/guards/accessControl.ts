import type { RouteAccess } from '@/app/routes/access';

/** Decides whether the current user satisfies a route's access requirements. */
export type AccessDecider = (access: RouteAccess) => boolean;

// Deny by default until the auth/permission module registers a real decider.
const denyAll: AccessDecider = () => false;
let decider: AccessDecider = denyAll;

export const setAccessDecider = (next: AccessDecider | null): void => {
  decider = next ?? denyAll;
};
export const canAccess = (access: RouteAccess = {}): boolean => decider(access);
