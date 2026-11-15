import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/Alert';

/** Shown while the server asked the client to wait (HTTP 429 + Retry-After). */
export function RateLimitNotice({ secondsLeft }: { secondsLeft: number }) {
  const { t } = useTranslation('errors');
  if (secondsLeft <= 0) return null;
  return <Alert variant="warning">{t('rateLimitedWait', { count: secondsLeft })}</Alert>;
}
