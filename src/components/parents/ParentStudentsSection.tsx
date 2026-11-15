import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { Button, Pagination, Skeleton } from '@/components/ui';
import { useParentStudents } from '@/hooks/useParents';
import { usePreferencesStore } from '@/store';
import { STUDENT_STATUSES, type StudentStatus } from '@/types';
import { formatDate, formatNumber } from '@/utils/format';
import { AddressLine, StatusChip } from './ParentParts';
import styles from './ParentStudents.module.css';

/** The parent's students (dedicated endpoint), with the documented status filter and server pagination. */
export function ParentStudentsSection({ parentId }: { parentId: string }) {
  const { t } = useTranslation('parents');
  const language = usePreferencesStore((s) => s.language);
  const [status, setStatus] = useState<StudentStatus | null>(null);
  const [page, setPage] = useState(1);
  const query = useParentStudents(parentId, page, status);
  const students = query.data?.data ?? [];
  const meta = query.data?.meta;

  const choose = (next: StudentStatus | null) => {
    setStatus(next);
    setPage(1);
  };

  return (
    <section className={styles.section} aria-labelledby="parent-students-title">
      <div className={styles.head}>
        <h2 id="parent-students-title" className={styles.title}>
          {t('students.title')}
        </h2>
        {meta && <span className={styles.count}>{t('students.total', { total: formatNumber(meta.total, language) })}</span>}
      </div>

      <div className={styles.filter} role="group" aria-label={t('students.filterLabel')}>
        {[null, ...STUDENT_STATUSES].map((value) => (
          <button key={value ?? 'all'} type="button" className={styles.seg} aria-pressed={status === value} onClick={() => choose(value)}>
            {value ? t(`status.${value}`) : t('students.all')}
          </button>
        ))}
      </div>

      {query.isPending ? (
        <div className={styles.panel} aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.skeletonRow}>
              <Skeleton height="1rem" width="45%" />
              <Skeleton height="0.8rem" width="70%" />
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <div className="stack-sm">
          <ApiErrorAlert error={query.error} title={t('students.errorTitle')} />
          <div>
            <Button onClick={() => void query.refetch()}>{t('list.retry')}</Button>
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyMark} aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6.5C10.4 5.3 8 4.8 4.5 5v12c3.5-.2 5.9.3 7.5 1.5 1.6-1.2 4-1.7 7.5-1.5V5c-3.5-.2-5.9.3-7.5 1.5z" />
              <path d="M12 6.5v12" />
            </svg>
          </span>
          <strong>{status ? t('students.emptyFilteredTitle', { status: t(`status.${status}`) }) : t('students.emptyTitle')}</strong>
          <p className="muted">{status ? t('students.emptyFilteredBody') : t('students.emptyBody')}</p>
          {status && <Button onClick={() => choose(null)}>{t('students.all')}</Button>}
        </div>
      ) : (
        <div className={styles.panel} aria-busy={query.isFetching || undefined}>
          <ul className={styles.list} aria-label={t('students.listLabel')}>
            {students.map((student) => (
              <li key={student.id} className={styles.student}>
                <div className={styles.who}>
                  <span className={styles.name}>{student.fullName}</span>
                  <span className={styles.facts}>{t('students.joined', { date: formatDate(student.joinDate, language) })}</span>
                </div>
                <div className={styles.facts}>
                  <span>
                    <span className={styles.factLabel}>{t('students.nationalId')}</span>
                    <bdi dir="ltr" className={styles.nid}>
                      {student.nationalId}
                    </bdi>
                  </span>
                  <AddressLine address={student.address} />
                </div>
                <span className={styles.chipCell}>
                  <StatusChip status={student.status} />
                </span>
              </li>
            ))}
          </ul>
          {meta && meta.totalPages > 1 && (
            <Pagination page={meta.page} totalPages={meta.totalPages} busy={query.isFetching} onChange={setPage} />
          )}
        </div>
      )}
    </section>
  );
}
