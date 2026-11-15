import { describe, expect, it } from 'vitest';
import { ApiError } from '@/services/api';
import { createQueryClient, shouldRetryQuery } from '@/services/query';

describe('query client', () => {
  it('retries only transient failures, at most twice', () => {
    expect(shouldRetryQuery(0, new ApiError('network'))).toBe(true);
    expect(shouldRetryQuery(0, new ApiError('server', { status: 500 }))).toBe(true);
    expect(shouldRetryQuery(2, new ApiError('server', { status: 500 }))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError('rate_limited', { status: 429 }))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError('not_found', { status: 404 }))).toBe(false);
    expect(shouldRetryQuery(0, new Error('boom'))).toBe(false);
  });

  it('has conservative defaults', () => {
    const defaults = createQueryClient().getDefaultOptions();
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.mutations?.retry).toBe(false);
  });
});
