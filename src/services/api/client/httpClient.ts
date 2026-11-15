import axios, { type AxiosRequestConfig } from 'axios';
import { env } from '@/app/config';
import type { ApiSuccessResponse } from '@/types';
import { registerInterceptors } from '../interceptors';

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl || undefined,
  timeout: env.apiTimeoutMs,
  headers: { Accept: 'application/json' },
});

registerInterceptors(httpClient);

/**
 * Typed request helper returning the response body (the success envelope, or '' for HTTP 204).
 * Cancellation: pass `signal` from an AbortController.
 * Failures always reject with an `ApiError`.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.request<T>(config);
  return response.data;
}

/** Like `request`, but unwraps the success envelope and returns only `data`. */
export async function requestData<TData>(config: AxiosRequestConfig): Promise<TData> {
  const body = await request<ApiSuccessResponse<TData>>(config);
  return body.data;
}
