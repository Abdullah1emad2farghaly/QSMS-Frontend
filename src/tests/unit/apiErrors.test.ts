import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { ApiError, normalizeApiError } from '@/services/api';

const httpError = (status: number, data: unknown, headers: Record<string, string> = {}) =>
  new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, { status, data, headers } as never);

describe('normalizeApiError', () => {
  it('maps timeouts', () => {
    expect(normalizeApiError(new AxiosError('t', 'ECONNABORTED')).kind).toBe('timeout');
  });

  it('maps missing responses to network errors', () => {
    expect(normalizeApiError(new AxiosError('n', 'ERR_NETWORK')).kind).toBe('network');
  });

  it('preserves code, localized message, locale, request id, status and field errors', () => {
    const result = normalizeApiError(
      httpError(400, {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validation failed.',
          locale: 'en',
          requestId: 'req-12345678',
          details: { fields: [{ field: 'phone', code: 'REQUIRED_FIELD', message: 'This field is required.' }] },
        },
      }),
    );
    expect(result.kind).toBe('validation');
    expect(result.status).toBe(400);
    expect(result.code).toBe('VALIDATION_FAILED');
    expect(result.serverMessage).toBe('Validation failed.');
    expect(result.message).toBe('Validation failed.');
    expect(result.locale).toBe('en');
    expect(result.requestId).toBe('req-12345678');
    expect(result.fieldErrors).toEqual([
      { field: 'phone', code: 'REQUIRED_FIELD', message: 'This field is required.' },
    ]);
  });

  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [413, 'payload_too_large'],
    [422, 'business_rule'],
    [429, 'rate_limited'],
    [500, 'server'],
  ])('maps HTTP %i to %s', (status, kind) => {
    expect(normalizeApiError(httpError(status, null)).kind).toBe(kind);
  });

  it('keeps raw details (e.g. maxActiveSessions) and reads Retry-After and the request-id header', () => {
    const result = normalizeApiError(
      httpError(
        429,
        { success: false, error: { code: 'RATE_LIMITED', message: 'm', locale: 'ar' } },
        { 'retry-after': '30', 'x-request-id': 'hdr-12345678' },
      ),
    );
    expect(result.retryAfterSeconds).toBe(30);
    expect(result.requestId).toBe('hdr-12345678');

    const limit = normalizeApiError(
      httpError(422, {
        success: false,
        error: { code: 'SESSION_LIMIT_REACHED', message: 'm', locale: 'en', details: { maxActiveSessions: 3 } },
      }),
    );
    expect(limit.details).toEqual({ maxActiveSessions: 3 });
    expect(limit.fieldErrors).toEqual([]);
  });

  it('ignores malformed field entries and non-envelope bodies', () => {
    const result = normalizeApiError(
      httpError(400, { success: false, error: { code: 'VALIDATION_FAILED', message: 'm', locale: 'en', details: { fields: [{ field: 1 }, 'x'] } } }),
    );
    expect(result.fieldErrors).toEqual([]);
    expect(normalizeApiError(httpError(502, '<html>bad gateway</html>')).code).toBeUndefined();
  });

  it('passes ApiError through and handles unknown values', () => {
    const original = new ApiError('server', { status: 500 });
    expect(normalizeApiError(original)).toBe(original);
    expect(normalizeApiError('x').kind).toBe('unknown');
  });
});
