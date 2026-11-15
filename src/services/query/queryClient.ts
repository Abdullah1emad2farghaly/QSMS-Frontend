import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api';

/** Transient failures worth retrying. 4xx answers (incl. 429) are deterministic: never auto-retried. */
const RETRYABLE_KINDS = new Set(['network', 'timeout', 'server']);
const MAX_RETRIES = 2;

export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= MAX_RETRIES) return false;
  return error instanceof ApiError ? RETRYABLE_KINDS.has(error.kind) : false;
};

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
      },
      mutations: { retry: false },
    },
  });
}

/** App-wide instance. Clear it (`queryClient.clear()`) when the signed-in user changes. */
export const queryClient = createQueryClient();
