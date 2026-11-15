import type { Language } from '@/app/config';

const LOCALES: Record<Language, string> = { ar: 'ar-EG', en: 'en-US' };

export const intlLocale = (language: Language): string => LOCALES[language];

/** Localized date + time ("Nov 12, 2026, 9:30 AM"). Returns the input for invalid dates. */
export function formatDateTime(iso: string, language: Language): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(intlLocale(language), { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatNumber(value: number, language: Language, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(intlLocale(language), options).format(value);
}
