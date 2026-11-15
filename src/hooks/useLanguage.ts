import { useTranslation } from 'react-i18next';
import type { Language } from '@/app/config';

/** The language currently displayed (i18n), so dates and numbers always match the visible text. */
export function useLanguage(): Language {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith('ar') ? 'ar' : 'en';
}
