import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PARENT_ROUTE_BUILDERS } from '@/app/routes/paths';
import { Skeleton } from '@/components/ui';
import { usePreferencesStore } from '@/store';
import type { Parent } from '@/types';
import { formatDate } from '@/utils/format';
import { AddressLine, ChevronIcon, Monogram } from './ParentParts';
import styles from './ParentLedger.module.css';

/**
 * The parents list. One DOM, three layouts: stacked cards on phones, name/phone + address on tablets,
 * and a column ledger (phone, address, registration date) from `lg`. The whole row is one link.
 */
export function ParentLedger({ parents, busy = false, footer }: { parents: readonly Parent[]; busy?: boolean; footer?: ReactNode }) {
  const { t } = useTranslation('parents');
  const language = usePreferencesStore((s) => s.language);
  return (
    <div className={styles.ledger} aria-busy={busy || undefined}>
      <div className={styles.head} aria-hidden="true">
        <span className={styles.headName}>{t('list.columns.parent')}</span>
        <span className={styles.headPhone}>{t('list.columns.phone')}</span>
        <span className={styles.headAddress}>{t('list.columns.address')}</span>
        <span className={styles.headDate}>{t('list.columns.added')}</span>
      </div>
      <ul className={styles.list} aria-label={t('list.listLabel')}>
        {parents.map((parent) => (
          <li key={parent.id}>
            <Link to={PARENT_ROUTE_BUILDERS.details(parent.id)} className={styles.row}>
              <span className={styles.seal}>
                <Monogram name={parent.name} />
              </span>
              <span className={styles.name}>{parent.name}</span>
              <span className={styles.phone}>
                <bdi dir="ltr">{parent.phone}</bdi>
              </span>
              <span className={styles.address}>
                <AddressLine address={parent.address} />
              </span>
              <span className={styles.date}>{formatDate(parent.createdAt, language)}</span>
              <span className={styles.chev}>
                <ChevronIcon />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {footer}
    </div>
  );
}

export function ParentLedgerSkeleton({ rows = 6 }: { rows?: number }) {
  const { t } = useTranslation('parents');
  return (
    <div className={styles.ledger} aria-busy="true" aria-label={t('list.listLabel')}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.skeletonRow} style={i > 0 ? { borderBlockStart: '1px solid var(--color-border)' } : undefined}>
          <span className={`skeleton ${styles.skeletonSeal}`} aria-hidden="true" />
          <span className={styles.skeletonLines}>
            <Skeleton height="1rem" width="55%" />
            <Skeleton height="0.8rem" width="80%" />
          </span>
        </div>
      ))}
    </div>
  );
}
