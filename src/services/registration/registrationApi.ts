import { buildEndpointRequest } from '@/services/api/endpoints';
import { request, requestData } from '@/services/api';
import type {
  ApiPaginatedResponse,
  GeographyOption,
  GovernoratesQuery,
  OrganizationLookupQuery,
  OrganizationOption,
  RegisterOrganizationData,
  RegisterOrganizationRequest,
  SubmitSchoolData,
  SubmitSchoolRequest,
} from '@/types';

/** The 5 documented public geography / organization / registration endpoints. */
export const registrationApi = {
  getCountries: (signal?: AbortSignal) =>
    requestData<GeographyOption[]>(buildEndpointRequest('getCountries', { signal })),

  /** Exactly one of `countryId` / `organizationId` (enforced by the type). */
  getGovernorates: (query: GovernoratesQuery, signal?: AbortSignal) =>
    requestData<GeographyOption[]>(buildEndpointRequest('getGovernorates', { query, signal })),

  /** Returns the full paginated envelope (`data` + `meta`). */
  getOrganizations: (query?: OrganizationLookupQuery, signal?: AbortSignal) =>
    request<ApiPaginatedResponse<OrganizationOption>>(buildEndpointRequest('getOrganizations', { query, signal })),

  registerOrganization: (body: RegisterOrganizationRequest) =>
    requestData<RegisterOrganizationData>(buildEndpointRequest('registerOrganization', { body })),

  submitSchool: (body: SubmitSchoolRequest) =>
    requestData<SubmitSchoolData>(buildEndpointRequest('submitSchool', { body })),
};
