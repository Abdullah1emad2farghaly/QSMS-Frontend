import { useTranslation } from 'react-i18next';
import { THEME_PREFERENCES, type ThemePreference } from '@/app/config';
import { usePreferencesStore } from '@/store';

export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);

  return (
    <select
      className="btn"
      aria-label={t('theme.label')}
      data-testid="theme-toggle"
      value={theme}
      onChange={(e) => setTheme(e.target.value as ThemePreference)}
    >
      {THEME_PREFERENCES.map((option) => (
        <option key={option} value={option}>
          {t(`theme.${option}`)}
        </option>
      ))}
    </select>
  );
}
