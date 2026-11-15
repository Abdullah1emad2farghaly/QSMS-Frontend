import { REQUEST_ID_PATTERN } from '@/types';

/** Generates a correlation id the server accepts (8–64 chars of letters, digits, `.`, `_`, `-`). */
export function generateRequestId(): string {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  // Defensive: never send a malformed id (the server would replace it anyway).
  return REQUEST_ID_PATTERN.test(id) ? id : `req-${Date.now().toString(36)}`;
}
