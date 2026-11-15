import type { ComponentType } from 'react';
import type { LazyRouteFunction, RouteObject } from 'react-router-dom';
import { GuestRoute } from '@/app/guards/GuestRoute';
import { ProtectedRoute } from '@/app/guards/ProtectedRoute';
import { AppShellLayout } from '@/app/layouts/AppShellLayout';
import { LANDING_ROLES } from '@/types';
import { PARENTS_ROUTES, ROLE_ROUTES, ROUTES } from './paths';
import { ROLE_HOME_PAGES } from './roleHomes';
import type { RouteAccess } from './access';

/** Lazy-load a page module whose default export is the page component. */
export const lazyPage =
  (loader: () => Promise<{ default: ComponentType }>): LazyRouteFunction<RouteObject> =>
  async () => ({ Component: (await loader()).default });

/** Public pages inside the public layout. Registration stays reachable for signed-in users too (optional auth). */
export const publicRoutes: RouteObject[] = [
  { index: true, lazy: lazyPage(() => import('@/pages/public/LandingPage')) },
  {
    // Sign-in and recovery: signed-in users are sent on to where they were going.
    element: <GuestRoute />,
    children: [
      { path: ROUTES.login, lazy: lazyPage(() => import('@/pages/auth/LoginPage')) },
      { path: ROUTES.forgotPassword, lazy: lazyPage(() => import('@/pages/auth/ForgotPasswordPage')) },
      { path: ROUTES.verifyOtp, lazy: lazyPage(() => import('@/pages/auth/VerifyOtpPage')) },
      { path: ROUTES.resetPassword, lazy: lazyPage(() => import('@/pages/auth/ResetPasswordPage')) },
    ],
  },
  { path: ROUTES.register, lazy: lazyPage(() => import('@/pages/public/RegistrationLandingPage')) },
  { path: ROUTES.registerOrganization, lazy: lazyPage(() => import('@/pages/public/OrganizationRegistrationPage')) },
  { path: ROUTES.registerSchool, lazy: lazyPage(() => import('@/pages/public/SchoolSubmissionPage')) },
];

/**
 * Wraps routes in an access guard and the signed-in app shell. Compose role-/permission-aware
 * groups with it, e.g. `guardedRoutes({ roles: ['TEACHER'] }, [...routes])`; `{}` = signed-in users only.
 */
export const guardedRoutes = (access: RouteAccess, children: RouteObject[]): RouteObject => ({
  element: <ProtectedRoute access={access} redirectTo={ROUTES.login} />,
  children: [{ element: <AppShellLayout />, children }],
});

/**
 * One guarded group per role landing route: only the session's ACTIVE role opens it. Which page sits
 * behind a route is decided in `roleHomes.ts` (temporary placeholders today).
 */
const roleLandingRoutes: RouteObject[] = LANDING_ROLES.map((role) =>
  guardedRoutes({ roles: [role] }, [{ path: ROLE_ROUTES[role], lazy: lazyPage(ROLE_HOME_PAGES[role]) }]),
);

/** Parents Manager module: only the ACTIVE role SCHOOL_MANAGER opens these pages (the backend enforces scope). */
const schoolManagerRoutes: RouteObject[] = [
  guardedRoutes({ roles: ['SCHOOL_MANAGER'] }, [
    { path: PARENTS_ROUTES.list, lazy: lazyPage(() => import('@/pages/school_managers/ParentsPage')) },
    { path: PARENTS_ROUTES.details, lazy: lazyPage(() => import('@/pages/school_managers/ParentDetailsPage')) },
  ]),
];

/** Signed-in screens of this module. Business modules add their own guarded groups next to it. */
export const protectedRoutes: RouteObject[] = [
  guardedRoutes({}, [
    { path: ROUTES.changePassword, lazy: lazyPage(() => import('@/pages/auth/ChangePasswordPage')) },
    { path: ROUTES.myDevices, lazy: lazyPage(() => import('@/pages/auth/MyDevicesPage')) },
    { path: ROUTES.selectRole, lazy: lazyPage(() => import('@/pages/auth/SelectRolePage')) },
  ]),
  ...roleLandingRoutes,
  ...schoolManagerRoutes,
];

export const notFoundRoute: RouteObject = {
  path: '*',
  lazy: lazyPage(() => import('@/pages/public/NotFoundPage')),
};
