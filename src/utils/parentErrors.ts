import i18n from '@/translation/i18n';
import { isApiError } from '@/services/api';
import { getApiErrorMessage } from './apiErrorMessage';

/**
 * Text for a Parents-module failure: the module's own wording for its documented codes
 * (`parents:errors.<CODE>`, with the address format spelled out), otherwise the shared fallback chain.
 */
export function getParentErrorMessage(error: unknown): string {
  if (!isApiError(error)) return i18n.t('unknown', { ns: 'errors' });
  const key = `errors.${error.code ?? ''}`;
  if (error.code && i18n.exists(key, { ns: 'parents' })) return i18n.t(key, { ns: 'parents' });
  return getApiErrorMessage(error);
}

/** Request fields a documented parent error belongs to, so the message appears next to the input. */
export const PARENT_ERROR_FIELD: Readonly<Record<string, 'name' | 'phone' | 'address'>> = {
  INVALID_PARENT_NAME: 'name',
  INVALID_PHONE_NUMBER: 'phone',
  PARENT_ALREADY_LINKED_TO_SCHOOL: 'phone',
  PARENT_ADDRESS_REQUIRED: 'address',
  INVALID_PARENT_ADDRESS: 'address',
  PARENT_ADDRESS_GOVERNORATE_NOT_FOUND: 'address',
  PARENT_ADDRESS_GOVERNORATE_INACTIVE: 'address',
  PARENT_ADDRESS_COUNTRY_MISMATCH: 'address',
};
