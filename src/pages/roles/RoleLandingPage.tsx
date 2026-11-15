import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';
import { RoleSwitcher } from '@/components/auth/RoleSwitcher';
import { useRoleState } from '@/hooks/useRoleState';
import styles from './RoleLandingPage.module.css';

/**
 * TEMPORARY, honest placeholder shared by the five roles: it states that the role is active and that
 * its interface is being prepared. It shows no statistics, records or actions. The route guard has
 * already established the active role; replace this page per role in `app/routes/roleHomes.ts`.
 */
export default function RoleLandingPage() {
  const { t } = useTranslation('roles');
  const { active, available } = useRoleState();
  if (!active) return <Navigate to={ROUTES.selectRole} replace />;

  const role = t(`names.${active}`);

  return (
    <div className={styles.page}>
      <section className={`card ${styles.panel}`} aria-labelledby="role-landing-title" data-testid="role-landing" data-role={active}>
        <span className={styles.icon} aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6.5C10.4 5.3 8 4.8 4.5 5v12c3.5-.2 5.9.3 7.5 1.5 1.6-1.2 4-1.7 7.5-1.5V5c-3.5-.2-5.9.3-7.5 1.5z" />
            <path d="M12 6.5v12" />
          </svg>
          <span className={styles.check}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
        </span>
        <h1 id="role-landing-title" className={styles.title}>
          {t('landing.welcome')}
        </h1>
        <p className={styles.activated} role="status">
          {t('landing.activated', { role })}
        </p>
        <p className="muted">{t('landing.preparing', { role })}</p>
        {available.length > 1 && (
          <div className={styles.switch}>
            <span className="muted">{t('landing.switchHint')}</span>
            <RoleSwitcher />
          </div>
        )}
      </section>
    </div>
  );
}
