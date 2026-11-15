import type { ApplicantInput, ApplicantResult } from './applicant';
import type { IsoDateTime, PaginationQuery, SortQuery, Uuid } from './api';

/** One option of `GET /organizations/lookup`. */
export interface OrganizationOption {
  id: Uuid;
  name: string;
}

/** Query of `GET /organizations/lookup`. Allowed sort field: `name` (always ordered by name). */
export type OrganizationLookupQuery = PaginationQuery & SortQuery;

export interface RegisterOrganizationRequest {
  applicant: ApplicantInput;
  organization: {
    /** maxLength 200; unique system-wide. */
    name: string;
    countryId: Uuid;
    governorateId: Uuid;
    /** maxLength 200; optional free text (center or city). */
    centerName?: string | null;
    /** maxLength 200; optional free text. */
    villageName?: string | null;
  };
}

export type OrganizationStatus = 'ACTIVE' | 'INACTIVE';

export interface Organization {
  id: Uuid;
  /** Gap-free code such as `ORG-000002`. */
  code: string;
  name: string;
  status: OrganizationStatus;
  countryId: Uuid;
  address: {
    governorateId: Uuid;
    centerName: string | null;
    villageName: string | null;
  };
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** `data` of `POST /organizations` (201). */
export interface RegisterOrganizationData {
  organization: Organization;
  applicant: ApplicantResult;
}
