import { useTranslation } from 'react-i18next';

export function ErrorFallback() {
  const { t } = useTranslation('errors');
  return (
    <div className="center-screen" role="alert">
      <h1>{t('boundary.title')}</h1>
      <p className="muted">{t('boundary.description')}</p>
      <button type="button" className="btn" onClick={() => window.location.reload()}>
        {t('boundary.reload')}
      </button>
    </div>
  );
}
