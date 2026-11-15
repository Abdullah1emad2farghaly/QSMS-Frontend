import { SUPPORTED_LANGUAGES, type Language } from './constants';

const raw = import.meta.env;

const toPositiveNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const toLanguage = (value: unknown): Language =>
  SUPPORTED_LANGUAGES.includes(value as Language) ? (value as Language) : 'ar';

/**
 * The base URL is the server origin; endpoint paths already include the `/api/v1` prefix
 * (see `services/api/endpoints`). A trailing slash or `/api/v1` is stripped to avoid double prefixes.
 */
const toBaseUrl = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/, '');

/** Single access point for environment configuration. Only VITE_* values are exposed. */
export const env = {
  mode: raw.MODE,
  isDev: raw.DEV,
  isProd: raw.PROD,
  apiBaseUrl: toBaseUrl(raw.VITE_API_BASE_URL),
  apiTimeoutMs: toPositiveNumber(raw.VITE_API_TIMEOUT_MS, 30_000),
  defaultLanguage: toLanguage(raw.VITE_DEFAULT_LANGUAGE),
} as const;
