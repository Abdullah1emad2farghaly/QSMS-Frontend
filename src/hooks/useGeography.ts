import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { ORGANIZATION_PAGE_SIZE } from '@/app/config';
import { registrationApi } from '@/services/registration/registrationApi';
import { queryKeys } from '@/services/query';

const TEN_MINUTES = 10 * 60_000;

/** Active countries (reference data, public). */
export function useCountries() {
  return useQuery({
    queryKey: queryKeys.geography.countries,
    queryFn: ({ signal }) => registrationApi.getCountries(signal),
    staleTime: TEN_MINUTES,
  });
}

/**
 * Governorates of a country (organization registration) or of an organization (school submission).
 * Exactly one scope is ever sent. Disabled until a parent is selected.
 */
export function useGovernorates(scope: { countryId: string } | { organizationId: string } | null) {
  return useQuery({
    queryKey: scope ? queryKeys.geography.governorates(scope) : ['geography', 'governorates', 'none'],
    queryFn: ({ signal }) => registrationApi.getGovernorates(scope!, signal),
    enabled: scope !== null,
    staleTime: TEN_MINUTES,
  });
}

/** Paginated organization lookup with "load more". Only `{ id, name }` per organization. */
export function useOrganizationLookup(pageSize: number = ORGANIZATION_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: queryKeys.organizations.lookup(pageSize),
    queryFn: ({ pageParam, signal }) =>
      registrationApi.getOrganizations({ page: String(pageParam), pageSize: String(pageSize) }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    staleTime: 60_000,
  });
}
