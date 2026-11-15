import { LANGUAGE_DIRECTION, type Language, type ThemePreference } from '@/app/config';

export function applyLanguage(language: Language): void {
  const root = document.documentElement;
  root.lang = language;
  root.dir = LANGUAGE_DIRECTION[language];
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function applyTheme(preference: ThemePreference): void {
  const resolved = resolveTheme(preference);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}
