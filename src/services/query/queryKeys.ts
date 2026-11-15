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
  /** Parents module (SCHOOL_MANAGER). Everything sits under the role scope, so a role switch drops it. */
  parents: {
    all: ['role', 'SCHOOL_MANAGER', 'parents'] as const,
    list: (schoolId: string, query: { page: number; pageSize: number; sort: string }) =>
      ['role', 'SCHOOL_MANAGER', 'parents', 'list', schoolId, query] as const,
    detail: (parentId: string) => ['role', 'SCHOOL_MANAGER', 'parents', 'detail', parentId] as const,
    students: (parentId: string, query: { page: number; pageSize: number; sort: string; status: string | null }) =>
      ['role', 'SCHOOL_MANAGER', 'parents', 'students', parentId, query] as const,
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
