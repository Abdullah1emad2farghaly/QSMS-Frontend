import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Total number of records (from the server `meta`). */
  totalLabel?: string;
  onChange: (page: number) => void;
  /** Disables the controls while a page is being fetched. */
  busy?: boolean;
  /** Accessible name of the navigation region (defaults to a generic label). */
  label?: string;
}

/** Previous / next pager driven by the server's `meta` (page + totalPages). */
export function Pagination({ page, totalPages, totalLabel, onChange, busy = false, label }: PaginationProps) {
  const { t } = useTranslation('parents');
  const pages = Math.max(1, totalPages);
  return (
    <nav className={styles.bar} aria-label={label ?? t('pagination.label')}>
      {totalLabel && <span className={`muted ${styles.total}`}>{totalLabel}</span>}
      <div className={styles.controls}>
        <Button variant="ghost" onClick={() => onChange(page - 1)} disabled={busy || page <= 1}>
          <span aria-hidden="true" className={styles.arrow}>‹</span>
          {t('pagination.previous')}
        </Button>
        <span className={styles.page} aria-current="page">
          {t('pagination.page', { page, total: pages })}
        </span>
        <Button variant="ghost" onClick={() => onChange(page + 1)} disabled={busy || page >= pages}>
          {t('pagination.next')}
          <span aria-hidden="true" className={styles.arrow}>›</span>
        </Button>
      </div>
    </nav>
  );
}
