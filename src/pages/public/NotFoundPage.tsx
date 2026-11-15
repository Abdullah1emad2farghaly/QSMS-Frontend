import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <section className="center-screen">
      <h1>{t('notFound.title')}</h1>
      <p className="muted">{t('notFound.description')}</p>
      <Link className="btn" to={ROUTES.root}>
        {t('notFound.backHome')}
      </Link>
    </section>
  );
}
