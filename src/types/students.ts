import type { IsoDateTime, PaginationQuery, SortQuery, Uuid } from './api';
import type { ParentAddress } from './parents';

export const STUDENT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

/** One student as returned by `GET /students/parents/{parentId}`. */
export interface ParentStudent {
  id: Uuid;
  schoolId: Uuid;
  organizationId: Uuid;
  parentId: Uuid;
  fullName: string;
  nationalId: string;
  /** Calendar date (`YYYY-MM-DD`), not a timestamp. */
  joinDate: string;
  status: StudentStatus;
  address: ParentAddress;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/**
 * Query of `GET /students/parents/{parentId}`. Sort: createdAt, joinDate, fullName (`-` = descending).
 * `filter[status]`: one or several (comma-separated) of ACTIVE, INACTIVE, ARCHIVED.
 */
export type ParentStudentsQuery = PaginationQuery &
  SortQuery & {
    'filter[status]'?: string;
  };
