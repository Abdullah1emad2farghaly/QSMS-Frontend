/** Central query-key factory. `auth` data is user-specific and is cleared when the session ends. */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    sessions: ['auth', 'sessions'] as const,
  },
  /**
   * Role-dependent data MUST be keyed under `role.scope(activeRole, …)`: a switch removes the whole
   * `['role']` tree and the key itself differs per role, so one role's data never shows for another.
   */
  role: {
    all: ['role'] as const,
    scope: (role: string, ...parts: readonly unknown[]) => ['role', role, ...parts] as const,
  },
  geography: {
    all: ['geography'] as const,
    countries: ['geography', 'countries'] as const,
    governorates: (scope: { countryId: string } | { organizationId: string }) =>
      ['geography', 'governorates', scope] as const,
  },
  organizations: {
    lookup: (pageSize: number) => ['organizations', 'lookup', { pageSize }] as const,
  },
};
