import { useTranslation } from 'react-i18next';
import { GPS_MAX_ACCURACY_METERS } from '@/app/config';
import { Alert, Button } from '@/components/ui';
import type { GpsState } from '@/hooks/useGeolocationCapture';
import { useLanguage } from '@/hooks/useLanguage';
import { formatNumber } from '@/utils/format';

interface GpsLocationCardProps {
  state: GpsState;
  onCapture: () => void;
  error?: string;
}

/** Explains why location is needed and runs the capture only when the user presses the button. */
export function GpsLocationCard({ state, onCapture, error }: GpsLocationCardProps) {
  const { t } = useTranslation('registration');
  const language = useLanguage();
  const meters = (value: number) => formatNumber(value, language, { maximumFractionDigits: 1 });

  const requesting = state.status === 'requesting';
  const failed = ['denied', 'unavailable', 'timeout', 'unsupported', 'inaccurate'].includes(state.status);
  const idle = state.status === 'idle';

  return (
    <div className="stack">
      <p className="muted">{t('gps.why')}</p>
      <p className="muted">{t('gps.limit', { meters: GPS_MAX_ACCURACY_METERS })}</p>

      {state.status === 'success' && (
        <Alert variant="success" title={t('gps.ok')}>
          {t('gps.accuracy', { meters: meters(state.reading.accuracyMeters) })}
        </Alert>
      )}
      {state.status === 'inaccurate' && (
        <Alert variant="warning" title={t('gps.tooInaccurate')}>
          {t('gps.accuracy', { meters: meters(state.reading.accuracyMeters) })} — {t('gps.moveOutside')}
        </Alert>
      )}
      {state.status === 'denied' && <Alert variant="error">{t('gps.denied')}</Alert>}
      {state.status === 'unavailable' && <Alert variant="error">{t('gps.unavailable')}</Alert>}
      {state.status === 'timeout' && <Alert variant="error">{t('gps.timeout')}</Alert>}
      {state.status === 'unsupported' && <Alert variant="error">{t('gps.unsupported')}</Alert>}
      {requesting && (
        <p role="status" className="muted">
          {t('gps.requesting')}
        </p>
      )}

      <div>
        <Button variant={state.status === 'success' ? 'secondary' : 'primary'} loading={requesting} onClick={onCapture}>
          {idle ? t('gps.capture') : failed || state.status === 'success' ? t('gps.retry') : t('gps.capture')}
        </Button>
      </div>
      {error && state.status !== 'success' && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
