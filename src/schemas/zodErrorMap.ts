import { z } from 'zod';
import i18n from '@/translation/i18n';

/** Localized Zod messages. Evaluated at parse time, so they follow the active language. */
export function registerZodErrorMap(): void {
  z.setErrorMap((issue, ctx) => {
    const t = (key: string, options?: Record<string, unknown>) =>
      i18n.t(key, { ns: 'validation', ...options });

    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        return { message: issue.received === 'undefined' ? t('required') : t('invalid') };
      case z.ZodIssueCode.too_small:
        if (issue.type === 'string') {
          return {
            message:
              Number(issue.minimum) <= 1 ? t('required') : t('tooShort', { count: Number(issue.minimum) }),
          };
        }
        return { message: t('invalid') };
      case z.ZodIssueCode.too_big:
        if (issue.type === 'string') return { message: t('tooLong', { count: Number(issue.maximum) }) };
        return { message: t('invalid') };
      case z.ZodIssueCode.invalid_string:
        if (issue.validation === 'email') return { message: t('invalidEmail') };
        return { message: t('invalid') };
      default:
        return { message: ctx.defaultError };
    }
  });
}
