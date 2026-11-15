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

/**
 * Localized calendar date ("Nov 12, 2026"). A date-only value (`YYYY-MM-DD`, e.g. a join date) is
 * formatted in UTC so it never shifts to the neighbouring day; timestamps use the device time zone.
 */
export function formatDate(value: string, language: Language): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat(intlLocale(language), { dateStyle: 'medium', ...(dateOnly ? { timeZone: 'UTC' } : {}) }).format(date);
}
