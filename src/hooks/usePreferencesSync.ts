import { useEffect } from 'react';
import i18n from '@/translation/i18n';
import { usePreferencesStore } from '@/store';
import { applyLanguage, applyTheme } from '@/utils/document';

/** Keeps <html lang/dir>, the theme, i18n language and document title in sync with the store. */
export function usePreferencesSync(): void {
  const language = usePreferencesStore((s) => s.language);
  const theme = usePreferencesStore((s) => s.theme);

  useEffect(() => {
    applyLanguage(language);
    void i18n.changeLanguage(language).then(() => {
      document.title = i18n.t('app.title', { ns: 'common' });
    });
  }, [language]);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);
}
