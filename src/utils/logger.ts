import { env } from '@/app/config';

/** Development: full details. Production: concise output, no external monitoring service. */
export const logger = {
  debug: (...args: unknown[]) => {
    if (env.isDev) console.debug('[qsms]', ...args);
  },
  warn: (...args: unknown[]) => console.warn('[qsms]', ...args),
  error: (message: string, error?: unknown) => {
    if (env.isDev) console.error('[qsms]', message, error);
    else console.error('[qsms]', message);
    // Extension point: forward to a monitoring service here if one is adopted later.
  },
};
