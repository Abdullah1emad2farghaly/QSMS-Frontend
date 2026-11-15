import axios from 'axios';
import type { ApiFieldError, ApiLocale } from '@/types';

/** Coarse category derived from the HTTP status (meanings from the API contract). */
export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'misconfigured'
  | 'validation' // 400
  | 'unauthorized' // 401
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'conflict' // 409
  | 'payload_too_large' // 413
  | 'business_rule' // 422
  | 'rate_limited' // 429
  | 'server' // 5xx
  | 'unknown';

export interface ApiErrorInit {
  status?: number;
  /** Stable backend code, e.g. `INVALID_CREDENTIALS`. */
  code?: string;
  /** Message localized by the backend (language of the request). */
  serverMessage?: string;
  locale?: ApiLocale;
  requestId?: string;
  /** From `error.details.fields[]`. */
  fieldErrors?: readonly ApiFieldError[];
  /** Raw `error.details` (shape depends on the code, e.g. `{ maxActiveSessions }`). */
  details?: unknown;
  /** From the `Retry-After` header (seconds). */
  retryAfterSeconds?: number;
}

/** Normalized API failure. Preserves backend code, localized message, field errors, request id and status. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly serverMessage?: string;
  readonly locale?: ApiLocale;
  readonly requestId?: string;
  readonly fieldErrors: readonly ApiFieldError[];
  readonly details?: unknown;
  readonly retryAfterSeconds?: number;

  constructor(kind: ApiErrorKind, init: ApiErrorInit = {}) {
    super(init.serverMessage ?? kind);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = init.status;
    this.code = init.code;
    this.serverMessage = init.serverMessage;
    this.locale = init.locale;
    this.requestId = init.requestId;
    this.fieldErrors = init.fieldErrors ?? [];
    this.details = init.details;
    this.retryAfterSeconds = init.retryAfterSeconds;
  }

  /** Fallback i18n key in the `errors` namespace (used when the backend sent no message). */
  get messageKey(): string {
    return `errors:${this.kind}`;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/** True when the error carries exactly this backend code. */
export const hasErrorCode = (error: unknown, code: string): boolean =>
  isApiError(error) && error.code === code;

export const kindFromStatus = (status: number): ApiErrorKind => {
  if (status === 400) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 413) return 'payload_too_large';
  if (status === 422) return 'business_rule';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

/** Extracts `error.details.fields[]`; entries that do not match the documented shape are ignored. */
export const parseFieldErrors = (details: unknown): ApiFieldError[] => {
  if (!isRecord(details) || !Array.isArray(details.fields)) return [];
  const result: ApiFieldError[] = [];
  for (const entry of details.fields) {
    if (
      isRecord(entry) &&
      typeof entry.field === 'string' &&
      typeof entry.code === 'string' &&
      typeof entry.message === 'string'
    ) {
      result.push({ field: entry.field, code: entry.code, message: entry.message });
    }
  }
  return result;
};

const readHeader = (headers: unknown, name: string): string | undefined => {
  if (!headers || typeof headers !== 'object') return undefined;
  const h = headers as { get?: (n: string) => unknown } & Record<string, unknown>;
  const value = typeof h.get === 'function' ? h.get(name) : h[name.toLowerCase()];
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return undefined;
};

const parseRetryAfter = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
};

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isCancel(error)) return new ApiError('cancelled');
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return new ApiError('timeout');
    if (!error.response) return new ApiError('network');

    const { status, data, headers } = error.response;
    const envelope = isRecord(data) && data.success === false && isRecord(data.error) ? data.error : undefined;
    const locale = envelope?.locale === 'ar' || envelope?.locale === 'en' ? envelope.locale : undefined;

    return new ApiError(kindFromStatus(status), {
      status,
      code: asString(envelope?.code),
      serverMessage: asString(envelope?.message),
      locale,
      requestId: asString(envelope?.requestId) ?? readHeader(headers, 'X-Request-Id'),
      fieldErrors: parseFieldErrors(envelope?.details),
      details: envelope?.details,
      retryAfterSeconds: parseRetryAfter(readHeader(headers, 'Retry-After')),
    });
  }
  return new ApiError('unknown');
}
