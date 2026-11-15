import type { PaginationMeta, Uuid } from './api';
import type {
  ActiveSessionsData,
  AuthSessionData,
  ChangePasswordRequest,
  LoginRequest,
  PasswordRecoveryRequestBody,
  PasswordRecoveryRequestData,
  PasswordRecoveryResetRequest,
  PasswordRecoveryVerifyData,
  PasswordRecoveryVerifyRequest,
  RefreshTokenRequest,
  SwitchRoleData,
  SwitchRoleRequest,
} from './auth';
import type { GeographyOption, GovernoratesQuery } from './geography';
import type {
  OrganizationLookupQuery,
  OrganizationOption,
  RegisterOrganizationData,
  RegisterOrganizationRequest,
} from './organizations';
import type {
  ParentSchoolLink,
  Parent,
  ParentsListQuery,
  RegisterParentData,
  RegisterParentRequest,
  UpdateParentAddressRequest,
} from './parents';
import type { SubmitSchoolData, SubmitSchoolRequest } from './schools';
import type { ParentStudent, ParentStudentsQuery } from './students';

/**
 * Request/response contract of every documented endpoint, keyed by OpenAPI `operationId`.
 * `data` is the success-envelope `data` (`void` for HTTP 204). A key typed `undefined`
 * means the endpoint has none of that part; `X | undefined` means it is optional.
 */
export interface EndpointContractMap {
  login: { body: LoginRequest; query: undefined; pathParams: undefined; data: AuthSessionData; meta: undefined };
  refreshTokens: { body: RefreshTokenRequest; query: undefined; pathParams: undefined; data: AuthSessionData; meta: undefined };
  /** UNVERIFIED contract (see `SwitchRoleData`). */
  switchRole: { body: SwitchRoleRequest; query: undefined; pathParams: undefined; data: SwitchRoleData; meta: undefined };
  logout: { body: undefined; query: undefined; pathParams: undefined; data: void; meta: undefined };
  logoutAll: { body: undefined; query: undefined; pathParams: undefined; data: void; meta: undefined };
  changePassword: { body: ChangePasswordRequest; query: undefined; pathParams: undefined; data: void; meta: undefined };
  listMyDevices: { body: undefined; query: undefined; pathParams: undefined; data: ActiveSessionsData; meta: undefined };
  revokeMyDevice: { body: undefined; query: undefined; pathParams: { sessionId: Uuid }; data: void; meta: undefined };
  requestPasswordRecovery: { body: PasswordRecoveryRequestBody; query: undefined; pathParams: undefined; data: PasswordRecoveryRequestData; meta: undefined };
  verifyPasswordRecoveryOtp: { body: PasswordRecoveryVerifyRequest; query: undefined; pathParams: undefined; data: PasswordRecoveryVerifyData; meta: undefined };
  resetPassword: { body: PasswordRecoveryResetRequest; query: undefined; pathParams: undefined; data: void; meta: undefined };
  getCountries: { body: undefined; query: undefined; pathParams: undefined; data: GeographyOption[]; meta: undefined };
  getGovernorates: { body: undefined; query: GovernoratesQuery; pathParams: undefined; data: GeographyOption[]; meta: undefined };
  getOrganizations: { body: undefined; query: OrganizationLookupQuery | undefined; pathParams: undefined; data: OrganizationOption[]; meta: PaginationMeta };
  registerOrganization: { body: RegisterOrganizationRequest; query: undefined; pathParams: undefined; data: RegisterOrganizationData; meta: undefined };
  submitSchool: { body: SubmitSchoolRequest; query: undefined; pathParams: undefined; data: SubmitSchoolData; meta: undefined };
  // Parents module (SCHOOL_MANAGER)
  listParents: { body: undefined; query: ParentsListQuery | undefined; pathParams: { schoolId: Uuid }; data: Parent[]; meta: PaginationMeta };
  registerParent: { body: RegisterParentRequest; query: undefined; pathParams: undefined; data: RegisterParentData; meta: undefined };
  getParent: { body: undefined; query: undefined; pathParams: { id: Uuid }; data: Parent; meta: undefined };
  updateParentAddress: { body: UpdateParentAddressRequest; query: undefined; pathParams: { id: Uuid }; data: Parent; meta: undefined };
  listParentStudents: { body: undefined; query: ParentStudentsQuery | undefined; pathParams: { parentId: Uuid }; data: ParentStudent[]; meta: PaginationMeta };
  endParentSchoolLink: { body: undefined; query: undefined; pathParams: { id: Uuid; schoolId: Uuid }; data: ParentSchoolLink; meta: undefined };
}

export type OperationId = keyof EndpointContractMap;
