/**
 * Every error code documented for the 15 endpoints in the foundation contract.
 * Codes are stable and language-independent; the server may add more later, so
 * `ApiError.code` stays a plain string and `hasErrorCode()` narrows when needed.
 */
export const API_ERROR_CODES = [
  // Generic
  'VALIDATION_FAILED',
  'INVALID_JSON',
  'PAYLOAD_TOO_LARGE',
  'INTERNAL_ERROR',
  'RATE_LIMITED',
  // Authentication / session
  'AUTHENTICATION_REQUIRED',
  'ACCESS_TOKEN_INVALID',
  'ACCESS_TOKEN_EXPIRED',
  'SESSION_REVOKED',
  'ACCOUNT_INACTIVE',
  'PASSWORD_CHANGE_REQUIRED',
  'INVALID_CREDENTIALS',
  'SESSION_CONCURRENT_MODIFICATION',
  'SESSION_LIMIT_REACHED',
  'SESSION_NOT_FOUND',
  'REFRESH_TOKEN_INVALID',
  'REFRESH_TOKEN_EXPIRED',
  'REFRESH_TOKEN_REUSED',
  // Passwords / recovery
  'INVALID_PASSWORD',
  'CURRENT_PASSWORD_INCORRECT',
  'NEW_PASSWORD_SAME_AS_CURRENT',
  'OTP_INVALID',
  'RESET_TOKEN_INVALID',
  'RECOVERY_CONCURRENT_MODIFICATION',
  // Geography
  'GEOGRAPHY_NODE_INACTIVE',
  'GEOGRAPHY_NODE_NOT_FOUND',
  'INVALID_GEOGRAPHY_HIERARCHY',
  // Organizations
  'ORGANIZATION_NOT_FOUND',
  'INVALID_ORGANIZATION_NAME',
  'ORGANIZATION_COUNTRY_INVALID',
  'ORGANIZATION_ADDRESS_COUNTRY_MISMATCH',
  'ORGANIZATION_NAME_ALREADY_EXISTS',
  'INVALID_PARENT_ADDRESS',
  // Applicants / schools
  'INVALID_APPLICANT_NAME',
  'INVALID_PHONE_NUMBER',
  'USER_PHONE_ALREADY_EXISTS',
  'SCHOOL_APPLICANT_IDENTITY_MISMATCH',
  'SCHOOL_MANAGER_NOT_ELIGIBLE',
  'INVALID_SCHOOL_NAME',
  'INVALID_GPS_COORDINATES',
  'GPS_ACCURACY_EXCEEDS_LIMIT',
  'SCHOOL_COUNTRY_MISMATCH',
  'PARENT_ADDRESS_COUNTRY_MISMATCH',
  'SCHOOL_NAME_ALREADY_EXISTS',
  'SCHOOL_CONCURRENT_MODIFICATION',
  'SCHOOL_ORGANIZATION_INACTIVE',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/**
 * The 401 codes that mean "the current access token/session is unusable".
 * Login (`INVALID_CREDENTIALS`) and refresh (`REFRESH_TOKEN_*`) 401s are deliberately NOT here:
 * they are answers of public endpoints and must not trigger the session-ended handler.
 */
export const SESSION_AUTH_ERROR_CODES: readonly ApiErrorCode[] = [
  'AUTHENTICATION_REQUIRED',
  'ACCESS_TOKEN_INVALID',
  'ACCESS_TOKEN_EXPIRED',
  'SESSION_REVOKED',
];

export const isSessionAuthErrorCode = (code: string | undefined): boolean =>
  code !== undefined && (SESSION_AUTH_ERROR_CODES as readonly string[]).includes(code);
