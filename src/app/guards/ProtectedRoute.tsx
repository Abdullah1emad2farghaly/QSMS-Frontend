import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { ROLE_ROUTES, ROUTES } from '@/app/routes/paths';
import type { RouteAccess } from '@/app/routes/access';
import { useRoleState } from '@/hooks/useRoleState';
import { useAuthStore } from '@/store';
import { canAccess } from './accessControl';

interface ProtectedRouteProps {
  /** Requirements to check (authentication only when omitted). */
  access?: RouteAccess;
  /** Where anonymous users are sent. */
  redirectTo?: string;
  /** Where signed-in users that lack the requirements are sent (default: their active role's landing page, else home). */
  forbiddenRedirectTo?: string;
}

/**
 * Guards a route group:
 *  1. a stored session being re-validated at startup shows a loading screen (no flash of login);
 *  2. anonymous → sign-in (remembering where they were going);
 *  3. a forced password change confines the user to the change-password screen;
 *  4. role-specific routes need an established active role: several roles and none active → role selection;
 *  5. otherwise the registered access decider decides (a role requirement is met by the ACTIVE role only);
 *     a user who is denied is sent to their own landing page.
 */
export function ProtectedRoute({ access, redirectTo = ROUTES.login, forbiddenRedirectTo }: ProtectedRouteProps) {
  const status = useAuthStore((s) => s.status);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const { active, needsSelection } = useRoleState();
  const location = useLocation();

  if (status === 'restoring') return <LoadingScreen />;
  if (status === 'anonymous') return <Navigate to={redirectTo} replace state={{ from: location }} />;
  if (mustChangePassword && location.pathname !== ROUTES.changePassword) {
    return <Navigate to={ROUTES.changePassword} replace />;
  }
  const roleSpecific = Boolean(access?.roles && access.roles.length > 0);
  if (roleSpecific && needsSelection) return <Navigate to={ROUTES.selectRole} replace state={{ from: location }} />;
  if (canAccess(access)) return <Outlet />;
  return <Navigate to={forbiddenRedirectTo ?? (active ? ROLE_ROUTES[active] : ROUTES.root)} replace />;
}
