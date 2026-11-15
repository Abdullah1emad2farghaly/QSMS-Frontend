import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';

/** App title linking home; truncates instead of wrapping so narrow headers never overflow. */
export function BrandLink({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Link to={ROUTES.root} className={className} style={{ textDecoration: 'none' }}>
      {t('app.title')}
    </Link>
  );
}
