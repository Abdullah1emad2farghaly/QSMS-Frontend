import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/auth/authApi';
import { logout, logoutAll, revokeSession } from '@/services/auth/authActions';
import { queryKeys } from '@/services/query';

/** The caller's active sessions. Answers are `no-store`: never reuse stale data on remount. */
export function useSessions() {
  return useQuery({
    queryKey: queryKeys.auth.sessions,
    queryFn: ({ signal }) => authApi.listSessions(signal),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isCurrent }: { id: string; isCurrent: boolean }) => revokeSession(id, isCurrent),
    onSuccess: (_data, { isCurrent }) => {
      // Revoking this device ends the local session (cache already cleared); otherwise refresh the list.
      if (!isCurrent) void queryClient.invalidateQueries({ queryKey: queryKeys.auth.sessions });
    },
  });
}

export const useLogout = () => useMutation({ mutationFn: logout });
export const useLogoutAll = () => useMutation({ mutationFn: logoutAll });
