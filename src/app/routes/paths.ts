import type { LandingRole } from '@/types/roles';

export const ROUTES = {
  root: '/',
  // Public
  login: '/login',
  forgotPassword: '/forgot-password',
  verifyOtp: '/verify-otp',
  resetPassword: '/reset-password',
  register: '/register',
  registerOrganization: '/register/organization',
  registerSchool: '/register/school',
  // Protected
  changePassword: '/change-password',
  selectRole: '/select-role',
  myDevices: '/my-devices',
} as const;

/**
 * Where a signed-in user lands when no earlier location is known. No dashboard exists yet,
 * so this is a real authenticated screen of this module. Change it when a home screen exists.
 */
export const POST_LOGIN_FALLBACK = ROUTES.myDevices;

/**
 * Temporary landing destinations, one per role. Each is a placeholder until the real dashboard
 * exists (see `app/routes/roleHomes.ts`); the paths themselves are meant to stay.
 */
export const ROLE_ROUTES: Record<LandingRole, string> = {
  MAIN_ADMIN: '/main-admin',
  ORGANIZATION_MANAGER: '/organization-manager',
  SCHOOL_MANAGER: '/school-manager',
  TEACHER: '/teacher',
  PARENT: '/parent',
};
