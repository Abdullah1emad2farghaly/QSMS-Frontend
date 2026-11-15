import { buildEndpointRequest } from '@/services/api/endpoints';
import { request, requestData } from '@/services/api';
import type {
  ApiPaginatedResponse,
  Parent,
  ParentSchoolLink,
  ParentStudent,
  ParentStudentsQuery,
  ParentsListQuery,
  RegisterParentData,
  RegisterParentRequest,
  UpdateParentAddressRequest,
} from '@/types';

/** The 6 Parents Manager endpoints. Lists return the full paginated envelope (`data` + `meta`). */
export const parentsApi = {
  list: (schoolId: string, query?: ParentsListQuery, signal?: AbortSignal) =>
    request<ApiPaginatedResponse<Parent>>(buildEndpointRequest('listParents', { pathParams: { schoolId }, query, signal })),

  register: (body: RegisterParentRequest) =>
    requestData<RegisterParentData>(buildEndpointRequest('registerParent', { body })),

  get: (id: string, signal?: AbortSignal) =>
    requestData<Parent>(buildEndpointRequest('getParent', { pathParams: { id }, signal })),

  updateAddress: (id: string, body: UpdateParentAddressRequest) =>
    requestData<Parent>(buildEndpointRequest('updateParentAddress', { pathParams: { id }, body })),

  listStudents: (parentId: string, query?: ParentStudentsQuery, signal?: AbortSignal) =>
    request<ApiPaginatedResponse<ParentStudent>>(
      buildEndpointRequest('listParentStudents', { pathParams: { parentId }, query, signal }),
    ),

  endSchoolLink: (id: string, schoolId: string) =>
    requestData<ParentSchoolLink>(buildEndpointRequest('endParentSchoolLink', { pathParams: { id, schoolId } })),
};

/** Builds the register body. The phone is normalized to ASCII digits; nothing else is derived or invented. */
export function buildRegisterParentPayload(
  schoolId: string,
  values: { name: string; phone: string; address: string },
  normalize: (value: string) => string,
): RegisterParentRequest {
  return {
    schoolId,
    name: values.name.trim().split(/\s+/).join(' '),
    phone: normalize(values.phone.trim()),
    address: values.address.trim(),
  };
}
