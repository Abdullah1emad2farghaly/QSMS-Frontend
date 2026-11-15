import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/Alert';
import { isApiError } from '@/services/api';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

/** Shows an API failure as a localized message plus the support reference. Never shows technical details. `message` lets a module supply its own text for the error. */
export function ApiErrorAlert({ error, title, message: override }: { error: unknown; title?: string; message?: string }) {
  const { t } = useTranslation('errors');
  const message = override ?? (isApiError(error) ? getApiErrorMessage(error) : t('unknown'));
  const requestId = isApiError(error) ? error.requestId : undefined;
  return (
    <Alert variant="error" title={title}>
      <span>{message}</span>
      {requestId && (
        <small className="muted" style={{ display: 'block', marginBlockStart: 'var(--space-1)' }}>
          {t('reference')} <bdi dir="ltr">{requestId}</bdi>
        </small>
      )}
    </Alert>
  );
}
