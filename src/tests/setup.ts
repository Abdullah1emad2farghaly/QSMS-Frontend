import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom has no matchMedia; mobile-first hooks and the Drawer rely on it.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

// jsdom has no layout engine: window.scrollTo is "not implemented" (logs an error). Pages call it when paging.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

// react-router's data router builds a Request with an AbortSignal created by jsdom's AbortController, and
// Node's built-in Request rejects that foreign signal ("Expected signal to be an instance of AbortSignal").
// Retry without the signal in that case; the router keeps its own controller, so behaviour is unchanged.
const NativeRequest = globalThis.Request;
if (NativeRequest) {
  const TolerantRequest = function (input: RequestInfo | URL, init?: RequestInit) {
    if (init?.signal) {
      try {
        return new NativeRequest(input, init);
      } catch {
        const { signal: _foreignSignal, ...rest } = init;
        return new NativeRequest(input, rest);
      }
    }
    return new NativeRequest(input, init);
  } as unknown as typeof Request;
  TolerantRequest.prototype = NativeRequest.prototype;
  Object.setPrototypeOf(TolerantRequest, NativeRequest);
  globalThis.Request = TolerantRequest;
}

afterEach(() => cleanup());
