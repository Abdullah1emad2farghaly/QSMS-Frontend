import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { DeviceSessionCard } from '@/components/sessions/DeviceSessionCard';
import { Alert, Button, ConfirmationDialog, EmptyState, PageHeading, Skeleton } from '@/components/ui';
import { useLogoutAll, useRevokeSession, useSessions } from '@/hooks/useSessions';
import { useLanguage } from '@/hooks/useLanguage';
import type { ActiveSession } from '@/types';
import { formatNumber } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { isApiError } from '@/services/api';
import styles from './MyDevicesPage.module.css';

export default function MyDevicesPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const language = useLanguage();
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const logoutAll = useLogoutAll();
  const [target, setTarget] = useState<ActiveSession | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const message = (error: unknown) => (isApiError(error) ? getApiErrorMessage(error) : null);

  const confirmRevoke = () => {
    if (!target) return;
    revoke.mutate(
      { id: target.id, isCurrent: target.isCurrent },
      {
        onSuccess: () => {
          setTarget(null);
          // Revoking THIS device ends the local session: the route guard sends the user to sign-in.
          if (target.isCurrent) navigate(ROUTES.login, { replace: true });
          else setNotice(t('devices.revokedNotice'));
        },
      },
    );
  };

  const confirmLogoutAll = () =>
    logoutAll.mutate(undefined, {
      onSuccess: () => {
        setConfirmAll(false);
        navigate(ROUTES.login, { replace: true });
      },
    });

  const data = sessions.data;
  const busyId = revoke.isPending ? revoke.variables?.id : undefined;

  return (
    <div className={styles.page}>
      <PageHeading
        title={t('devices.title')}
        description={t('devices.subtitle')}
        actions={
          data && (
            <span className={styles.count} aria-live="polite">
              {t('devices.count', {
                used: formatNumber(data.items.length, language),
                max: formatNumber(data.maxActiveSessions, language),
              })}
            </span>
          )
        }
      />

      {notice && <Alert variant="success">{notice}</Alert>}

      {sessions.isPending && (
        <ul className={styles.grid} aria-busy="true" aria-label={t('devices.loading')}>
          {[0, 1].map((i) => (
            <li key={i} className="card">
              <div className="stack-sm">
                <Skeleton height="1.4rem" width="60%" />
                <Skeleton />
                <Skeleton />
                <Skeleton height="2.75rem" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {sessions.isError && (
        <div className="stack-sm">
          <ApiErrorAlert error={sessions.error} title={t('devices.loadError')} />
          <div>
            <Button onClick={() => void sessions.refetch()} loading={sessions.isRefetching}>
              {t('devices.retry')}
            </Button>
          </div>
        </div>
      )}

      {data && data.items.length === 0 && <EmptyState title={t('devices.empty')} />}

      {data && data.items.length > 0 && (
        <ul className={styles.grid}>
          {data.items.map((session) => (
            <DeviceSessionCard
              key={session.id}
              session={session}
              language={language}
              busy={busyId === session.id}
              disabled={revoke.isPending}
              onRevoke={(s) => {
                revoke.reset();
                setNotice(null);
                setTarget(s);
              }}
            />
          ))}
        </ul>
      )}

      <section className="card stack-sm">
        <h2 className={styles.sectionTitle}>{t('devices.logoutAllTitle')}</h2>
        <p className="muted">{t('devices.logoutAllBody')}</p>
        <div>
          <Button
            variant="danger"
            onClick={() => {
              logoutAll.reset();
              setConfirmAll(true);
            }}
          >
            {t('devices.logoutAllButton')}
          </Button>
        </div>
      </section>

      <ConfirmationDialog
        open={target !== null}
        destructive
        title={target?.isCurrent ? t('devices.confirmCurrentTitle') : t('devices.confirmTitle')}
        description={target?.isCurrent ? t('devices.confirmCurrentBody') : t('devices.confirmBody', { device: target?.deviceLabel ?? t('devices.unnamed') })}
        confirmLabel={target?.isCurrent ? t('devices.signOutThis') : t('devices.revoke')}
        loading={revoke.isPending}
        errorMessage={message(revoke.error) ?? (revoke.error ? t('devices.genericError') : null)}
        onConfirm={confirmRevoke}
        onCancel={() => setTarget(null)}
      />
      <ConfirmationDialog
        open={confirmAll}
        destructive
        title={t('devices.logoutAllConfirmTitle')}
        description={t('devices.logoutAllConfirmBody')}
        confirmLabel={t('devices.logoutAllButton')}
        loading={logoutAll.isPending}
        errorMessage={message(logoutAll.error) ?? (logoutAll.error ? t('devices.genericError') : null)}
        onConfirm={confirmLogoutAll}
        onCancel={() => setConfirmAll(false)}
      />
    </div>
  );
}
