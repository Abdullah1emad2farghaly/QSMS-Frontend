import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { resolvePostLoginPath } from '@/app/routes/postLogin';
import { useAuthStore } from '@/store';

/** Sign-in / recovery screens: signed-in users are sent on to where they were going. */
export function GuestRoute() {
  const status = useAuthStore((s) => s.status);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const roles = useAuthStore((s) => s.roles);
  const activeRole = useAuthStore((s) => s.activeRole);
  const location = useLocation();
  if (status === 'restoring') return <LoadingScreen />;
  if (status === 'authenticated') return <Navigate to={resolvePostLoginPath(location.state, { mustChangePassword, roles, activeRole })} replace />;
  return <Outlet />;
}
