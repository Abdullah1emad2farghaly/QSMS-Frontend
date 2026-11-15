import type { ComponentType } from 'react';
import type { LandingRole } from '@/types';

/**
 * The page behind each role's landing route. EVERY role currently points at the shared temporary
 * placeholder. When a real dashboard exists, point its role at the new module here — authentication,
 * active-role handling, role switching, route protection and the API client stay untouched.
 */
type PageLoader = () => Promise<{ default: ComponentType }>;

export const ROLE_HOME_PAGES: Record<LandingRole, PageLoader> = {
  MAIN_ADMIN: () => import('@/pages/roles/RoleLandingPage'),
  ORGANIZATION_MANAGER: () => import('@/pages/roles/RoleLandingPage'),
  SCHOOL_MANAGER: () => import('@/pages/roles/RoleLandingPage'),
  TEACHER: () => import('@/pages/roles/RoleLandingPage'),
  PARENT: () => import('@/pages/roles/RoleLandingPage'),
};
