import { useTranslation } from 'react-i18next';
import type { Language } from '@/app/config';
import { Button } from '@/components/ui/Button';
import type { ActiveSession } from '@/types';
import { formatDateTime } from '@/utils/format';
import styles from './DeviceSessionCard.module.css';

interface DeviceSessionCardProps {
  session: ActiveSession;
  language: Language;
  /** This card's revoke request is running. */
  busy: boolean;
  /** Another card's revoke request is running. */
  disabled: boolean;
  onRevoke: (session: ActiveSession) => void;
}

/** One active session. Shows only what the API returns (never tokens). */
export function DeviceSessionCard({ session, language, busy, disabled, onRevoke }: DeviceSessionCardProps) {
  const { t } = useTranslation('auth');
  const name = session.deviceLabel ?? t('devices.unnamed');
  return (
    <li className={`card ${styles.card} ${session.isCurrent ? styles.current : ''}`.trim()} aria-busy={busy || undefined}>
      <div className={styles.head}>
        <h3 className={styles.name}>{name}</h3>
        {session.isCurrent && <span className={styles.badge}>{t('devices.current')}</span>}
      </div>
      <dl className={styles.facts}>
        <Fact label={t('devices.created')} value={formatDateTime(session.createdAt, language)} />
        <Fact label={t('devices.lastActive')} value={formatDateTime(session.lastActiveAt, language)} />
        <Fact label={t('devices.expires')} value={formatDateTime(session.expiresAt, language)} />
      </dl>
      <Button
        variant={session.isCurrent ? 'secondary' : 'danger'}
        loading={busy}
        disabled={disabled}
        onClick={() => onRevoke(session)}
        aria-label={`${session.isCurrent ? t('devices.signOutThis') : t('devices.revoke')} — ${name}`}
      >
        {session.isCurrent ? t('devices.signOutThis') : t('devices.revoke')}
      </Button>
    </li>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fact}>
      <dt className="muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
