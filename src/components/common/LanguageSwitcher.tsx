import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '@/store';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);

  return (
    <button
      type="button"
      className="btn"
      onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
      aria-label={t('language.label')}
      data-testid="language-switcher"
    >
      {t('language.switchTo')}
    </button>
  );
}
