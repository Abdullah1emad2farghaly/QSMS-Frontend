import { registerZodErrorMap } from '@/schemas';
import { registerAuthIntegration } from '@/services/auth/registerAuth';
import { usePreferencesStore } from '@/store';
import { applyLanguage, applyTheme } from '@/utils/document';
import { logger } from '@/utils/logger';

/** Runs once before first render: direction/theme (avoids a flash), Zod messages, global handlers. */
export function bootstrap(): void {
  const { language, theme } = usePreferencesStore.getState();
  applyLanguage(language);
  applyTheme(theme);
  registerZodErrorMap();
  registerAuthIntegration();

  window.addEventListener('error', (e) => logger.error('Uncaught error', e.error));
  window.addEventListener('unhandledrejection', (e) => logger.error('Unhandled rejection', e.reason));
}
