/**
 * Role codes returned in `roles[]` of the login/refresh answer (OpenAPI enum).
 * Informational for the client UI: authorization is always decided by the backend.
 */
export const USER_ROLES = [
  'MAIN_ADMIN',
  'ORGANIZATION_MANAGER',
  'GOVERNORATE_MANAGER',
  'CENTER_MANAGER',
  'VILLAGE_MANAGER',
  'SCHOOL_MANAGER',
  'TEACHER',
  'STUDENT',
  'PARENT',
  'SUBSCRIPTION_COLLECTOR',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Roles that have a landing destination in the web app today (temporary pages until the real
 * dashboards exist). Other backend roles are not offered in role selection or switching.
 */
export const LANDING_ROLES = [
  'MAIN_ADMIN',
  'ORGANIZATION_MANAGER',
  'SCHOOL_MANAGER',
  'TEACHER',
  'PARENT',
] as const satisfies readonly UserRole[];
export type LandingRole = (typeof LANDING_ROLES)[number];
