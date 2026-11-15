import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { normalizeDigits } from '@/utils/digits';
import { buildRegisterParentPayload, parentsApi } from '@/services/parents/parentsApi';
import { queryKeys } from '@/services/query';
import type { Parent, ParentStudentsQuery, StudentStatus } from '@/types';

export const PARENTS_PAGE_SIZE = 20;
export const STUDENTS_PAGE_SIZE = 10;
const PARENTS_SORT = '-createdAt';
const STUDENTS_SORT = '-createdAt';

/** One page of the school's parents. Pagination comes from `meta`, never from the array length. */
export function useParentsList(schoolId: string | null, page: number) {
  const query = { page, pageSize: PARENTS_PAGE_SIZE, sort: PARENTS_SORT };
  return useQuery({
    queryKey: schoolId ? queryKeys.parents.list(schoolId, query) : ['role', 'SCHOOL_MANAGER', 'parents', 'list', 'none'],
    queryFn: ({ signal }) =>
      parentsApi.list(schoolId!, { page: String(page), pageSize: String(PARENTS_PAGE_SIZE), sort: PARENTS_SORT }, signal),
    enabled: schoolId !== null,
    placeholderData: keepPreviousData,
  });
}

export function useParent(parentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.parents.detail(parentId ?? 'none'),
    queryFn: ({ signal }) => parentsApi.get(parentId!, signal),
    enabled: Boolean(parentId),
  });
}

/** Students of one parent. `status: null` = every status (the filter is simply not sent). */
export function useParentStudents(parentId: string | undefined, page: number, status: StudentStatus | null) {
  const key = { page, pageSize: STUDENTS_PAGE_SIZE, sort: STUDENTS_SORT, status };
  return useQuery({
    queryKey: queryKeys.parents.students(parentId ?? 'none', key),
    queryFn: ({ signal }) => {
      const query: ParentStudentsQuery = { page: String(page), pageSize: String(STUDENTS_PAGE_SIZE), sort: STUDENTS_SORT };
      if (status) query['filter[status]'] = status;
      return parentsApi.listStudents(parentId!, query, signal);
    },
    enabled: Boolean(parentId),
    placeholderData: keepPreviousData,
  });
}

export function useRegisterParent(schoolId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values: { name: string; phone: string; address: string }) => {
      if (!schoolId) throw new Error('No managed school');
      return parentsApi.register(buildRegisterParentPayload(schoolId, values, normalizeDigits));
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.parents.all }),
  });
}

export function useUpdateParentAddress(parentId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (address: string) => parentsApi.updateAddress(parentId, { address: address.trim() }),
    onSuccess: (parent) => {
      client.setQueryData(queryKeys.parents.detail(parentId), parent);
      // Lists show the address too: refetch them (the detail was just replaced with the server answer).
      return client.invalidateQueries({ queryKey: queryKeys.parents.all, predicate: (q) => q.queryKey[3] === 'list' });
    },
  });
}

export function useEndParentSchoolLink(parentId: string, schoolId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!schoolId) throw new Error('No managed school');
      return parentsApi.endSchoolLink(parentId, schoolId);
    },
    onSuccess: () => {
      // Keep the cached detail truthful (this school is no longer linked) instead of removing it while a page may still observe it.
      client.setQueryData<Parent>(queryKeys.parents.detail(parentId), (old) =>
        old ? { ...old, schoolIds: old.schoolIds.filter((id) => id !== schoolId) } : old,
      );
      void client.invalidateQueries({ queryKey: queryKeys.parents.all, predicate: (q) => q.queryKey[3] === 'list' });
    },
  });
}
