import type { ApiErrorCode, OperationId, UserRole } from '@/types';

/**
 * Maintainable reference of the documented endpoints (source of truth: the supplied QSMS
 * OpenAPI contract). It carries metadata only — no request functions, no workflows. Feature
 * modules build calls from it with `buildEndpointRequest()`.
 */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
/** none = public; required = Bearer JWT required; optional = a token may be sent and, if sent, must be valid. */
export type AuthMode = 'none' | 'required' | 'optional';
export type DecisionStatus = 'NOT_APPLICABLE' | 'APPROVED' | 'PROVISIONAL';

export interface EndpointErrorResponse {
  status: number;
  codes: readonly ApiErrorCode[];
}

export interface EndpointDefinition {
  operationId: OperationId;
  method: HttpMethod;
  /** Full path including the `/api/v1` prefix; `{name}` marks a path parameter. */
  path: string;
  summary: string;
  auth: AuthMode;
  /** OpenAPI security declaration, e.g. `[]` (public) or `[{ bearerAuth: [] }]`. */
  openApiSecurity: readonly Readonly<Record<string, readonly string[]>>[];
  authorization: {
    /** No endpoint documents a role requirement. */
    roles: readonly UserRole[];
    scope: string;
    enforcement: string;
    /** "none yet (permission-registry entry deferred, D-1/D-2)" for every endpoint. */
    permissionId: string | null;
    decisionStatus: DecisionStatus;
  };
  successStatus: 200 | 201 | 204;
  /** The success answer is sent with `Cache-Control: no-store`: never cache it client-side. */
  noStore: boolean;
  hasRequestBody: boolean;
  pathParams?: readonly string[];
  queryParams?: readonly string[];
  /** Documented non-2xx answers. */
  errors: readonly EndpointErrorResponse[];
  /** True when the contract could not be verified against backend documentation. */
  unverified?: boolean;
  /** Short pointers to rules that change client behavior. */
  notes?: readonly string[];
}

const BEARER = [{ bearerAuth: [] }] as const;
const PUBLIC_SECURITY = [] as const;
const OPTIONAL_BEARER = [{}, { bearerAuth: [] }] as const;
const PERMISSION_DEFERRED = null; // permission-registry entry deferred (D-1/D-2)

const E400_BODY = { status: 400, codes: ['VALIDATION_FAILED', 'INVALID_JSON'] } as const;
const E401_SESSION = {
  status: 401,
  codes: ['AUTHENTICATION_REQUIRED', 'ACCESS_TOKEN_INVALID', 'ACCESS_TOKEN_EXPIRED', 'SESSION_REVOKED'],
} as const;
const E403_INACTIVE = { status: 403, codes: ['ACCOUNT_INACTIVE'] } as const;
const E403_INACTIVE_OR_PWD = { status: 403, codes: ['ACCOUNT_INACTIVE', 'PASSWORD_CHANGE_REQUIRED'] } as const;
const E413 = { status: 413, codes: ['PAYLOAD_TOO_LARGE'] } as const;
const E429 = { status: 429, codes: ['RATE_LIMITED'] } as const;
const E500 = { status: 500, codes: ['INTERNAL_ERROR'] } as const;

const SCHOOL_MANAGER_AUTH: EndpointDefinition['authorization'] = {
  roles: ['SCHOOL_MANAGER'],
  scope: "The school(s) the caller actively manages (enforced by the backend).",
  enforcement: 'Bearer JWT + SCHOOL_MANAGER role; school scope is checked server-side.',
  permissionId: PERMISSION_DEFERRED,
  decisionStatus: 'APPROVED',
};

export const ENDPOINTS: Readonly<Record<OperationId, EndpointDefinition>> = {
  login: {
    operationId: 'login',
    method: 'POST',
    path: '/api/v1/auth/login',
    summary: 'Log in with phone and password',
    auth: 'none',
    openApiSecurity: PUBLIC_SECURITY,
    authorization: {
      roles: [],
      scope: 'None',
      enforcement: 'Public endpoint: this IS the authentication.',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 200,
    noStore: true,
    hasRequestBody: true,
    errors: [
      E400_BODY,
      { status: 401, codes: ['INVALID_CREDENTIALS'] },
      E403_INACTIVE,
      { status: 409, codes: ['SESSION_CONCURRENT_MODIFICATION'] },
      E413,
      { status: 422, codes: ['SESSION_LIMIT_REACHED'] },
      E500,
    ],
    notes: [
      'Up to 3 active sessions per account; the 4th login is refused with 422 SESSION_LIMIT_REACHED (details.maxActiveSessions = 3).',
      'Same INVALID_CREDENTIALS answer for unknown phone, malformed phone and wrong password.',
    ],
  },
  refreshTokens: {
    operationId: 'refreshTokens',
    method: 'POST',
    path: '/api/v1/auth/refresh',
    summary: 'Exchange a refresh token for new tokens',
    auth: 'none',
    openApiSecurity: PUBLIC_SECURITY,
    authorization: {
      roles: [],
      scope: 'None',
      enforcement: 'Public endpoint: the refresh token itself is the credential.',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 200,
    noStore: true,
    hasRequestBody: true,
    errors: [
      E400_BODY,
      { status: 401, codes: ['REFRESH_TOKEN_INVALID', 'REFRESH_TOKEN_EXPIRED', 'REFRESH_TOKEN_REUSED'] },
      E403_INACTIVE,
      { status: 409, codes: ['SESSION_CONCURRENT_MODIFICATION'] },
      E413,
      E500,
    ],
    notes: [
      'The refresh token is single-use and every refresh rotates it.',
      'Reusing a used refresh token revokes that session only (REFRESH_TOKEN_REUSED).',
    ],
  },
  switchRole: {
    operationId: 'switchRole',
    method: 'POST',
    path: '/api/v1/auth/switch-role',
    summary: "Switch the current session's active role",
    auth: 'required',
    openApiSecurity: BEARER,
    authorization: {
      roles: [],
      scope: "The caller's own current session (the active role is session-based).",
      enforcement: 'Authentication only; the backend decides which roles the account may activate.',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'PROVISIONAL',
    },
    successStatus: 200,
    noStore: true,
    hasRequestBody: true,
    unverified: true,
    // Only the answers every authenticated endpoint documents are listed: no role-specific
    // error codes are known (a rejected role is a 4xx whose code the client does not hard-code).
    errors: [E401_SESSION, E403_INACTIVE, E500],
    notes: [
      'UNVERIFIED: request { role } comes from the task description; the response shape and any role-specific error codes were not available.',
      'Affects the current session only; other sessions/devices keep their own active role.',
    ],
  },
  logout: {
    operationId: 'logout',
    method: 'POST',
    path: '/api/v1/auth/logout',
    summary: 'Log out the current session',
    auth: 'required',
    openApiSecurity: BEARER,
    authorization: {
      roles: [],
      scope: "The caller's own current session.",
      enforcement: 'Authentication only: the session comes from the verified access token.',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 204,
    noStore: false,
    hasRequestBody: false,
    errors: [E401_SESSION, E403_INACTIVE, E500],
  },
  logoutAll: {
    operationId: 'logoutAll',
    method: 'POST',
    path: '/api/v1/auth/logout-all',
    summary: 'Log out every session of the current user',
    auth: 'required',
    openApiSecurity: BEARER,
    authorization: {
      roles: [],
      scope: 'All sessions of the caller.',
      enforcement: 'Authentication only: the user comes from the verified access token.',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 204,
    noStore: false,
    hasRequestBody: false,
    errors: [E401_SESSION, E403_INACTIVE, E500],
  },
  changePassword: {
    operationId: 'changePassword',
    method: 'POST',
    path: '/api/v1/auth/change-password',
    summary: "Change the caller's own password",
    auth: 'required',
    openApiSecurity: BEARER,
    authorization: {
      roles: [],
      scope: "The caller's own account.",
      enforcement:
        'Authentication only: the user comes from the verified access token. Reachable while the account must still change its initial password.',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 204,
    noStore: true,
    hasRequestBody: true,
    errors: [
      { status: 400, codes: ['VALIDATION_FAILED', 'INVALID_JSON', 'INVALID_PASSWORD', 'CURRENT_PASSWORD_INCORRECT'] },
      E401_SESSION,
      E403_INACTIVE,
      E413,
      { status: 422, codes: ['NEW_PASSWORD_SAME_AS_CURRENT'] },
      E500,
    ],
    notes: [
      'Policy: 4–12 characters, different from the current password.',
      'Revokes every OTHER session; the current session stays valid and no token is reissued.',
    ],
  },
  listMyDevices: {
    operationId: 'listMyDevices',
    method: 'GET',
    path: '/api/v1/auth/sessions',
    summary: "My devices: list the caller's active sessions",
    auth: 'required',
    openApiSecurity: BEARER,
    authorization: {
      roles: [],
      scope: "The caller's own sessions.",
      enforcement:
        "Authentication only: the user comes from the verified access token; no other account's sessions can be listed.",
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 200,
    noStore: true,
    hasRequestBody: false,
    errors: [E401_SESSION, E403_INACTIVE_OR_PWD, E500],
  },
  revokeMyDevice: {
    operationId: 'revokeMyDevice',
    method: 'DELETE',
    path: '/api/v1/auth/sessions/{sessionId}',
    summary: 'My devices: revoke one session',
    auth: 'required',
    openApiSecurity: BEARER,
    authorization: {
      roles: [],
      scope: "One of the caller's own sessions.",
      enforcement:
        "Authentication plus ownership: the session must belong to the caller's account (checked server-side).",
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 204,
    noStore: true,
    hasRequestBody: false,
    pathParams: ['sessionId'],
    errors: [
      { status: 400, codes: ['VALIDATION_FAILED'] },
      E401_SESSION,
      E403_INACTIVE_OR_PWD,
      { status: 404, codes: ['SESSION_NOT_FOUND'] },
      E500,
    ],
  },
  requestPasswordRecovery: {
    operationId: 'requestPasswordRecovery',
    method: 'POST',
    path: '/api/v1/auth/password-recovery/request',
    summary: 'Request a password-recovery OTP',
    auth: 'none',
    openApiSecurity: PUBLIC_SECURITY,
    authorization: {
      roles: [],
      scope: 'None',
      enforcement: 'Public endpoint: protected by per-phone and per-IP rate limits.',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 200,
    noStore: true,
    hasRequestBody: true,
    errors: [E400_BODY, E413, E429, E500],
    notes: [
      'Always answers the same 200, even for unknown phones (no account enumeration).',
      '429 RATE_LIMITED carries a Retry-After header (seconds).',
    ],
  },
  verifyPasswordRecoveryOtp: {
    operationId: 'verifyPasswordRecoveryOtp',
    method: 'POST',
    path: '/api/v1/auth/password-recovery/verify',
    summary: 'Verify the OTP and get a reset token',
    auth: 'none',
    openApiSecurity: PUBLIC_SECURITY,
    authorization: {
      roles: [],
      scope: 'None',
      enforcement: 'Public endpoint: the OTP is the credential; failed attempts are limited.',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 200,
    noStore: true,
    hasRequestBody: true,
    errors: [
      { status: 400, codes: ['VALIDATION_FAILED', 'INVALID_JSON', 'OTP_INVALID'] },
      { status: 409, codes: ['RECOVERY_CONCURRENT_MODIFICATION'] },
      E413,
      E500,
    ],
  },
  resetPassword: {
    operationId: 'resetPassword',
    method: 'POST',
    path: '/api/v1/auth/password-recovery/reset',
    summary: 'Set a new password with a reset token',
    auth: 'none',
    openApiSecurity: PUBLIC_SECURITY,
    authorization: {
      roles: [],
      scope: 'None',
      enforcement: 'Public endpoint: the single-use reset token is the credential.',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 204,
    noStore: true,
    hasRequestBody: true,
    errors: [
      {
        status: 400,
        codes: ['VALIDATION_FAILED', 'INVALID_JSON', 'RESET_TOKEN_INVALID', 'INVALID_PASSWORD'],
      },
      { status: 409, codes: ['RECOVERY_CONCURRENT_MODIFICATION'] },
      E413,
      E500,
    ],
    notes: [
      'Revokes every session of the user. A rejected password (INVALID_PASSWORD) does not use up the reset token.',
    ],
  },
  getCountries: {
    operationId: 'getCountries',
    method: 'GET',
    path: '/api/v1/geography/countries',
    summary: 'The countries available for registration (public)',
    auth: 'none',
    openApiSecurity: PUBLIC_SECURITY,
    authorization: {
      roles: [],
      scope: 'None',
      enforcement:
        'Public endpoint: no authentication, no permission. It is read-only reference data and only `{ id, name }` is returned (never the code, status, parent or any organization information).',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 200,
    noStore: false,
    hasRequestBody: false,
    errors: [E500],
    notes: ['Not paginated. Names are returned as stored (Arabic) for both ar and en.'],
  },
  getGovernorates: {
    operationId: 'getGovernorates',
    method: 'GET',
    path: '/api/v1/geography/governorates',
    summary: 'The governorates of a country (public)',
    auth: 'none',
    openApiSecurity: PUBLIC_SECURITY,
    authorization: {
      roles: [],
      scope: 'None',
      enforcement:
        'Public endpoint: no authentication, no permission. It is read-only reference data and only `{ id, name }` is returned (never the code, status, parent or any organization information).',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 200,
    noStore: false,
    hasRequestBody: false,
    queryParams: ['countryId', 'organizationId'],
    errors: [
      { status: 400, codes: ['VALIDATION_FAILED', 'GEOGRAPHY_NODE_INACTIVE'] },
      { status: 404, codes: ['GEOGRAPHY_NODE_NOT_FOUND', 'ORGANIZATION_NOT_FOUND'] },
      E500,
    ],
    notes: ['EXACTLY ONE of countryId / organizationId must be sent. Not paginated.'],
  },
  getOrganizations: {
    operationId: 'getOrganizations',
    method: 'GET',
    path: '/api/v1/organizations/lookup',
    summary: 'The organizations a school submission may be sent to (public)',
    auth: 'none',
    openApiSecurity: PUBLIC_SECURITY,
    authorization: {
      roles: [],
      scope: 'None.',
      enforcement:
        'Public endpoint: no authentication and no permission. Read-only, and only `{ id, name }` leaves; it is a separate route from the protected `GET /organizations`.',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'NOT_APPLICABLE',
    },
    successStatus: 200,
    noStore: false,
    hasRequestBody: false,
    queryParams: ['page', 'pageSize', 'sort'],
    errors: [{ status: 400, codes: ['VALIDATION_FAILED'] }, E500],
    notes: [
      'Paginated (page=1, pageSize=20 by default; pageSize above 100 is capped). Allowed sort field: name; always ordered by name.',
    ],
  },
  registerOrganization: {
    operationId: 'registerOrganization',
    method: 'POST',
    path: '/api/v1/organizations',
    summary: 'Register an organization (public)',
    auth: 'optional',
    openApiSecurity: OPTIONAL_BEARER,
    authorization: {
      roles: [],
      scope: 'None for the caller; the applicant becomes ORGANIZATION_MANAGER of the new organization only.',
      enforcement:
        'Public endpoint with an optional Bearer token and a per-client-IP abuse limit (10 requests per hour). A token that is sent must be valid.',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'APPROVED',
    },
    successStatus: 201,
    noStore: false,
    hasRequestBody: true,
    errors: [
      {
        status: 400,
        codes: [
          'VALIDATION_FAILED',
          'INVALID_JSON',
          'INVALID_APPLICANT_NAME',
          'INVALID_PHONE_NUMBER',
          'INVALID_PASSWORD',
          'INVALID_ORGANIZATION_NAME',
          'ORGANIZATION_COUNTRY_INVALID',
          'INVALID_PARENT_ADDRESS',
          'ORGANIZATION_ADDRESS_COUNTRY_MISMATCH',
          'INVALID_GEOGRAPHY_HIERARCHY',
          'GEOGRAPHY_NODE_INACTIVE',
        ],
      },
      E401_SESSION,
      E403_INACTIVE,
      { status: 404, codes: ['GEOGRAPHY_NODE_NOT_FOUND'] },
      {
        status: 409,
        codes: ['ORGANIZATION_NAME_ALREADY_EXISTS', 'USER_PHONE_ALREADY_EXISTS', 'SCHOOL_APPLICANT_IDENTITY_MISMATCH'],
      },
      E413,
      { status: 422, codes: ['SCHOOL_MANAGER_NOT_ELIGIBLE'] },
      E429,
      E500,
    ],
    notes: [
      'applicant.password is required when no token is sent and ignored when a valid token is sent.',
      'Some address errors send details as a plain, non-localized array of { field, code }.',
    ],
  },
  submitSchool: {
    operationId: 'submitSchool',
    method: 'POST',
    path: '/api/v1/schools/submissions',
    summary: 'Submit a school request (public)',
    auth: 'optional',
    openApiSecurity: OPTIONAL_BEARER,
    authorization: {
      roles: [],
      scope: 'None. The applicant gets no role until the request is approved.',
      enforcement:
        'Public endpoint with an optional Bearer token and a per-client-IP abuse limit (10 requests per hour).',
      permissionId: PERMISSION_DEFERRED,
      decisionStatus: 'PROVISIONAL',
    },
    successStatus: 201,
    noStore: false,
    hasRequestBody: true,
    errors: [
      {
        status: 400,
        codes: [
          'VALIDATION_FAILED',
          'INVALID_JSON',
          'INVALID_APPLICANT_NAME',
          'INVALID_PHONE_NUMBER',
          'INVALID_PASSWORD',
          'INVALID_SCHOOL_NAME',
          'INVALID_GPS_COORDINATES',
          'GPS_ACCURACY_EXCEEDS_LIMIT',
          'SCHOOL_COUNTRY_MISMATCH',
          'PARENT_ADDRESS_COUNTRY_MISMATCH',
          'INVALID_GEOGRAPHY_HIERARCHY',
          'GEOGRAPHY_NODE_INACTIVE',
        ],
      },
      E401_SESSION,
      E403_INACTIVE,
      { status: 404, codes: ['GEOGRAPHY_NODE_NOT_FOUND', 'ORGANIZATION_NOT_FOUND'] },
      {
        status: 409,
        codes: [
          'SCHOOL_NAME_ALREADY_EXISTS',
          'USER_PHONE_ALREADY_EXISTS',
          'SCHOOL_APPLICANT_IDENTITY_MISMATCH',
          'SCHOOL_CONCURRENT_MODIFICATION',
        ],
      },
      E413,
      { status: 422, codes: ['SCHOOL_ORGANIZATION_INACTIVE', 'SCHOOL_MANAGER_NOT_ELIGIBLE'] },
      E429,
      E500,
    ],
    notes: [
      'The school is created PENDING and grants nothing until the organization manager approves it.',
      'GPS accuracy must be 20 meters or better.',
    ],
  },
  // ── Parents module (SCHOOL_MANAGER) ───────────────────────────────────────────────────────────
  // Source: the parents contract supplied with the Parents Manager task. Its text documents the error
  // CODES of each endpoint but not their HTTP statuses, so only the codes are listed (in `notes`) and
  // no status is invented. Authorization (role + school scope) is enforced by the backend.
  listParents: {
    operationId: 'listParents',
    method: 'GET',
    path: '/api/v1/parents/schools/{schoolId}',
    summary: "List the parents linked to a school (newest first)",
    auth: 'required',
    openApiSecurity: BEARER,
    authorization: SCHOOL_MANAGER_AUTH,
    successStatus: 200,
    noStore: false,
    hasRequestBody: false,
    pathParams: ['schoolId'],
    queryParams: ['page', 'pageSize', 'sort'],
    errors: [E401_SESSION],
    notes: ['Paginated: `data` + `meta`. Only `createdAt` can be sorted (default `-createdAt`); pageSize max 100.'],
  },
  registerParent: {
    operationId: 'registerParent',
    method: 'POST',
    path: '/api/v1/parents',
    summary: 'Register a parent and link them to the school',
    auth: 'required',
    openApiSecurity: BEARER,
    authorization: SCHOOL_MANAGER_AUTH,
    successStatus: 201,
    noStore: false,
    hasRequestBody: true,
    errors: [{ status: 400, codes: ['VALIDATION_FAILED'] }, E401_SESSION],
    notes: [
      'Request `address` is a STRING "Governorate / Center or City / Village" (the frontend never sends `addressFields`).',
      'The backend creates or reuses the login account; the response never contains a password.',
      'Documented business codes: INVALID_PARENT_NAME, PARENT_ADDRESS_REQUIRED, INVALID_PARENT_ADDRESS, PARENT_ADDRESS_GOVERNORATE_NOT_FOUND, PARENT_ADDRESS_GOVERNORATE_INACTIVE, PARENT_ADDRESS_COUNTRY_MISMATCH, INVALID_PHONE_NUMBER, PARENT_IDENTITY_CONFLICT, PARENT_ACCOUNT_INACTIVE, PARENT_ORGANIZATION_CONFLICT, PARENT_ALREADY_LINKED_TO_SCHOOL.',
    ],
  },
  getParent: {
    operationId: 'getParent',
    method: 'GET',
    path: '/api/v1/parents/{id}',
    summary: 'Get one parent',
    auth: 'required',
    openApiSecurity: BEARER,
    authorization: SCHOOL_MANAGER_AUTH,
    successStatus: 200,
    noStore: false,
    hasRequestBody: false,
    pathParams: ['id'],
    errors: [E401_SESSION],
    notes: ['`id` is the Parent record id, not `userId`. The answer does not include students (see listParentStudents).'],
  },
  updateParentAddress: {
    operationId: 'updateParentAddress',
    method: 'PATCH',
    path: '/api/v1/parents/{id}',
    summary: "Correct a parent's address",
    auth: 'required',
    openApiSecurity: BEARER,
    authorization: SCHOOL_MANAGER_AUTH,
    successStatus: 200,
    noStore: false,
    hasRequestBody: true,
    pathParams: ['id'],
    errors: [{ status: 400, codes: ['VALIDATION_FAILED'] }, E401_SESSION],
    notes: [
      'Only the address can change; send `address` (string, max 600) and never `addressFields`.',
      'Documented business code: PARENT_UPDATE_EMPTY (plus the address codes of registerParent).',
    ],
  },
  listParentStudents: {
    operationId: 'listParentStudents',
    method: 'GET',
    path: '/api/v1/students/parents/{parentId}',
    summary: "List a parent's students",
    auth: 'required',
    openApiSecurity: BEARER,
    authorization: SCHOOL_MANAGER_AUTH,
    successStatus: 200,
    noStore: false,
    hasRequestBody: false,
    pathParams: ['parentId'],
    queryParams: ['page', 'pageSize', 'sort', 'filter[status]'],
    errors: [E401_SESSION],
    notes: [
      '`parentId` is the Parent record id, not `userId`.',
      'Sort: createdAt, joinDate, fullName. `filter[status]`: ACTIVE, INACTIVE, ARCHIVED (comma-separated for several).',
      'The backend only returns students of schools the manager actively manages.',
    ],
  },
  endParentSchoolLink: {
    operationId: 'endParentSchoolLink',
    method: 'DELETE',
    path: '/api/v1/parents/{id}/schools/{schoolId}',
    summary: "End a parent's link with one school",
    auth: 'required',
    openApiSecurity: BEARER,
    authorization: SCHOOL_MANAGER_AUTH,
    successStatus: 200,
    noStore: false,
    hasRequestBody: false,
    pathParams: ['id', 'schoolId'],
    errors: [E401_SESSION],
    notes: [
      'Ends the Parent-to-School link for THIS school only: it does not delete the parent or the account and keeps other schools and address history.',
      'Documented business code: PARENT_HAS_STUDENTS_IN_SCHOOL (the link cannot end while the parent still has students here).',
    ],
  },
};

export const getEndpoint = (operationId: OperationId): EndpointDefinition => ENDPOINTS[operationId];
