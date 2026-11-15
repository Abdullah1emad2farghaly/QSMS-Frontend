import type { AxiosRequestConfig } from 'axios';
import type { EndpointContractMap, OperationId } from '@/types';
import { ENDPOINTS } from './registry';

type Part<Name extends string, T> = undefined extends T
  ? { [P in Name]?: Exclude<T, undefined> }
  : { [P in Name]: T };

/** Input of an endpoint call: `body`, `query` and `pathParams` are required exactly when the contract requires them. */
export type EndpointInput<K extends OperationId> = Part<'body', EndpointContractMap[K]['body']> &
  Part<'query', EndpointContractMap[K]['query']> &
  Part<'pathParams', EndpointContractMap[K]['pathParams']> & { signal?: AbortSignal };

/**
 * Builds the axios config for a documented endpoint: method, path (path parameters
 * substituted and URL-encoded), query, body, and `skipAuth` for public endpoints.
 * Execute it with `request()` / `requestData()` from `@/services/api`.
 */
export function buildEndpointRequest<K extends OperationId>(
  operationId: K,
  input: EndpointInput<K>,
): AxiosRequestConfig {
  const definition = ENDPOINTS[operationId];
  const { body, query, pathParams, signal } = input as {
    body?: unknown;
    query?: Record<string, unknown>;
    pathParams?: Record<string, string>;
    signal?: AbortSignal;
  };

  const url = definition.path.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = pathParams?.[name];
    if (value === undefined) throw new Error(`Missing path parameter "${name}" for ${operationId}`);
    return encodeURIComponent(value);
  });

  return {
    method: definition.method,
    url,
    params: query,
    data: body,
    signal,
    skipAuth: definition.auth === 'none',
  };
}
