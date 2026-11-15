export { createQueryClient, queryClient, shouldRetryQuery } from './queryClient';
export { queryKeys } from './queryKeys';

import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';

/** Drops the active role's data: in-flight requests are cancelled (their results are ignored) and cached data removed. */
export function clearRoleScopedCache(): void {
  void queryClient.cancelQueries({ queryKey: queryKeys.role.all });
  queryClient.removeQueries({ queryKey: queryKeys.role.all });
}

/** Drops every user-specific query (sessions, role data). Public reference data (geography, organizations) stays. */
export function clearAuthenticatedCache(): void {
  void queryClient.cancelQueries({ queryKey: queryKeys.auth.all });
  queryClient.removeQueries({ queryKey: queryKeys.auth.all });
  clearRoleScopedCache();
}
