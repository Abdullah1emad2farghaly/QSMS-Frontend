import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { ROLE_ROUTES } from '@/app/routes/paths';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { Alert, EmptyState } from '@/components/ui';
import { useRoleState } from '@/hooks/useRoleState';
import { useSwitchRole } from '@/hooks/useSwitchRole';
import styles from './SelectRolePage.module.css';

/** Shown only while the account has several roles and none is active in this session. */
export default function SelectRolePage() {
  const { t } = useTranslation('roles');
  const { available, active, needsSelection } = useRoleState();
  const mutation = useSwitchRole();

  // A role is already established (single role, or chosen earlier): never ask again.
  if (!needsSelection && active) return <Navigate to={ROLE_ROUTES[active]} replace />;

  if (available.length === 0) {
    return (
      <AuthPageLayout title={t('select.title')}>
        <EmptyState title={t('select.noneTitle')} description={t('select.noneBody')} action={<LogoutButton />} />
      </AuthPageLayout>
    );
  }

  const pendingRole = mutation.isPending ? mutation.variables : undefined;

  return (
    <AuthPageLayout title={t('select.title')} subtitle={t('select.subtitle')} footer={<LogoutButton variant="ghost" />}>
      <div className="stack">
        {mutation.error && <ApiErrorAlert error={mutation.error} />}
        {mutation.isPending && <Alert variant="info">{t('select.activating')}</Alert>}
        <ul className={styles.list} aria-label={t('select.title')}>
          {available.map((role) => (
            <li key={role}>
              <button
                type="button"
                className={styles.role}
                disabled={mutation.isPending}
                aria-busy={pendingRole === role || undefined}
                onClick={() => mutation.mutate(role)}
              >
                <span className={styles.name}>{t(`names.${role}`)}</span>
                {pendingRole === role && <span className="spinner" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AuthPageLayout>
  );
}
