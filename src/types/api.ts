/**
 * Global API conventions and envelopes, taken from the QSMS OpenAPI contract.
 * Source of truth: the supplied API contract. Do not add undocumented fields.
 */

export type Uuid = string;
/** ISO 8601 date-time string (OpenAPI `format: date-time`). */
export type IsoDateTime = string;

export const API_VERSION_PREFIX = '/api/v1';

/** Locales the backend accepts in `Accept-Language` and returns in `error.locale` / `Content-Language`. */
export type ApiLocale = 'ar' | 'en';

/** Pagination conventions. `pageSize` above the maximum is capped by the server, not rejected. */
export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 100,
  maxSortFields: 3,
} as const;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Query parameters of paginated lists. The contract documents them as strings (`^[1-9]\d*$`). */
export interface PaginationQuery {
  page?: string;
  pageSize?: string;
}

/**
 * Sorting: comma-separated, whitelisted fields; a leading `-` means descending; at most
 * `PAGINATION.maxSortFields` fields. Each endpoint documents its own allowed fields.
 */
export interface SortQuery {
  sort?: string;
}

/** Success envelope. HTTP 204 responses have no body at all. */
export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
  requestId?: string;
}

/** Success envelope of paginated lists: `data` is an array and `meta` is always present. */
export interface ApiPaginatedResponse<TItem> {
  success: true;
  data: TItem[];
  meta: PaginationMeta;
  requestId?: string;
}

/** One entry of `error.details.fields[]` (validation errors). `message` is localized. */
export interface ApiFieldError {
  field: string;
  code: string;
  message: string;
}

/** `error.details` of validation errors. */
export interface ApiValidationDetails {
  fields: ApiFieldError[];
}

/**
 * A few business errors (address validation) send `details` as a plain, NOT localized array
 * of `{ field, code }`; use `error.message` for display in that case.
 */
export interface ApiAddressErrorEntry {
  field: string;
  code: string;
}

export interface ApiErrorBody {
  /** Stable, language-independent code (pattern `^[A-Z][A-Z0-9_]*$`). */
  code: string;
  /** Localized message (see `Accept-Language`). */
  message: string;
  locale: ApiLocale;
  requestId?: string;
  /** The contract types this as `any`: client-safe data whose shape depends on the error code. */
  details?: unknown;
}

export interface ApiFailureResponse {
  success: false;
  error: ApiErrorBody;
}

/** Request/response header names used by the API. */
export const API_HEADERS = {
  requestId: 'X-Request-Id',
  acceptLanguage: 'Accept-Language',
  contentLanguage: 'Content-Language',
  retryAfter: 'Retry-After',
} as const;

/** Correlation id format accepted by the server: 8–64 characters of letters, digits, `.`, `_`, `-`. */
export const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,64}$/;
