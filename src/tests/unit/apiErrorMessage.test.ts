import { describe, expect, it } from 'vitest';
import { ApiError } from '@/services/api';
import i18n from '@/translation/i18n';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

describe('getApiErrorMessage', () => {
  it('prefers a local code translation, then the backend message, then the kind fallback', async () => {
    await i18n.changeLanguage('en');
    i18n.addResourceBundle('en', 'errors', { codes: { INVALID_PASSWORD: 'Use 4–12 characters.' } }, true, true);

    expect(getApiErrorMessage(new ApiError('validation', { code: 'INVALID_PASSWORD', serverMessage: 'between {min} and {max}' }))).toBe(
      'Use 4–12 characters.',
    );
    expect(getApiErrorMessage(new ApiError('conflict', { code: 'SOME_NEW_CODE', serverMessage: 'Backend text' }))).toBe('Backend text');
    expect(getApiErrorMessage(new ApiError('rate_limited'))).toBe('Too many requests. Please try again later.');
  });
});
