import i18n from '@/translation/i18n';
import type { ApiError } from '@/services/api';

/**
 * User-facing text for an ApiError. Order:
 *  1. a local translation for the backend code (`errors:codes.<CODE>`), when one exists —
 *     lets the UI override texts that need client-side values (e.g. placeholders);
 *  2. the backend's localized message;
 *  3. the generic fallback for the error kind (`errors:<kind>`).
 */
export function getApiErrorMessage(error: ApiError): string {
  if (error.code) {
    const key = `codes.${error.code}`;
    // `details` (e.g. { maxActiveSessions }) feeds the message placeholders.
    const values = typeof error.details === 'object' && error.details !== null && !Array.isArray(error.details) ? error.details : {};
    if (i18n.exists(key, { ns: 'errors' })) return i18n.t(key, { ns: 'errors', ...values });
  }
  if (error.serverMessage) return error.serverMessage;
  return i18n.t(error.messageKey);
}
