import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { ButtonLink } from '@/components/ui';

export default function RegistrationLandingPage() {
  const { t } = useTranslation('registration');
  return (
    <AuthPageLayout
      wide
      title={t('landing.title')}
      subtitle={t('landing.subtitle')}
      footer={
        <span className="muted">
          {t('landing.haveAccount')}{' '}
          <Link className="link" to={ROUTES.login}>
            {t('landing.signIn')}
          </Link>
        </span>
      }
    >
      <div className="choice-grid">
        <section className="choice">
          <h2 className="choice-title">{t('landing.orgTitle')}</h2>
          <p className="muted">{t('landing.orgBody')}</p>
          <ButtonLink variant="primary" to={ROUTES.registerOrganization} block>
            {t('landing.orgCta')}
          </ButtonLink>
        </section>
        <section className="choice">
          <h2 className="choice-title">{t('landing.schoolTitle')}</h2>
          <p className="muted">{t('landing.schoolBody')}</p>
          <ButtonLink to={ROUTES.registerSchool} block>
            {t('landing.schoolCta')}
          </ButtonLink>
        </section>
      </div>
    </AuthPageLayout>
  );
}
