import { useMemo } from 'react';
import { useAuthStore } from '@/store';
import { getAvailableRoles, needsRoleSelection, resolveActiveRole } from '@/utils/roles';

/** The current session's role situation, derived from the backend answers held in the auth store. */
export function useRoleState() {
  const roles = useAuthStore((s) => s.roles);
  const activeRole = useAuthStore((s) => s.activeRole);
  return useMemo(
    () => ({
      available: getAvailableRoles(roles),
      active: resolveActiveRole(roles, activeRole),
      needsSelection: needsRoleSelection(roles, activeRole),
    }),
    [roles, activeRole],
  );
}
