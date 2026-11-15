export const SUPPORTED_LANGUAGES = ['ar', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_DIRECTION: Record<Language, 'rtl' | 'ltr'> = { ar: 'rtl', en: 'ltr' };

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const STORAGE_KEYS = {
  preferences: 'qsms.preferences',
  session: 'qsms.session',
} as const;

/**
 * Mobile-first breakpoints (min-width). CSS must repeat these literal values in its
 * `@media (min-width: …)` rules (CSS variables cannot be used in media queries).
 * Below `sm` is the base (mobile) layout.
 */
export const BREAKPOINTS = {
  sm: '40rem', // 640px — large phones / small tablets
  md: '48rem', // 768px — tablets
  lg: '64rem', // 1024px — laptops
  xl: '80rem', // 1280px — desktops
  '2xl': '96rem', // 1536px — large desktops
} as const;
export type BreakpointName = keyof typeof BREAKPOINTS;
export const BREAKPOINT_NAMES = Object.keys(BREAKPOINTS) as BreakpointName[];
export const mediaMinWidth = (name: BreakpointName): string => `(min-width: ${BREAKPOINTS[name]})`;

/** The backend rejects GPS readings less accurate than this (GPS_ACCURACY_EXCEEDS_LIMIT). */
export const GPS_MAX_ACCURACY_METERS = 20;
export const GPS_TIMEOUT_MS = 15_000;
export const ORGANIZATION_PAGE_SIZE = 20;
