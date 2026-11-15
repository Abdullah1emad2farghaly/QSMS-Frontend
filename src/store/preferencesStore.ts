import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  env,
  STORAGE_KEYS,
  SUPPORTED_LANGUAGES,
  THEME_PREFERENCES,
  type Language,
  type ThemePreference,
} from '@/app/config';

interface PreferencesState {
  language: Language;
  theme: ThemePreference;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemePreference) => void;
}

/** Global, persisted UI preferences. Auth and module stores will live beside this file later. */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: env.defaultLanguage,
      theme: 'system',
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: STORAGE_KEYS.preferences,
      partialize: (state) => ({ language: state.language, theme: state.theme }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PreferencesState>;
        return {
          ...current,
          language: SUPPORTED_LANGUAGES.includes(p.language as Language)
            ? (p.language as Language)
            : current.language,
          theme: THEME_PREFERENCES.includes(p.theme as ThemePreference)
            ? (p.theme as ThemePreference)
            : current.theme,
        };
      },
    },
  ),
);
