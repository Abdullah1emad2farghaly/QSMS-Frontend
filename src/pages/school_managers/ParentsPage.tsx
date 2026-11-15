import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { ParentLedger, ParentLedgerSkeleton } from '@/components/parents/ParentLedger';
import { PlusIcon } from '@/components/parents/ParentParts';
import { RegisterParentSheet } from '@/components/parents/RegisterParentSheet';
import { Alert, Button, EmptyState, PageHeading, Pagination } from '@/components/ui';
import { useManagedSchoolId } from '@/hooks/useManagedSchoolId';
import { useParentsList } from '@/hooks/useParents';
import { usePreferencesStore } from '@/store';
import { formatNumber } from '@/utils/format';
import styles from './ParentsPage.module.css';

const parsePage = (value: string | null): number => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
};

/** SCHOOL_MANAGER · parents of the managed school: list, register, and open a parent. */
export default function ParentsPage() {
  const { t } = useTranslation('parents');
  const language = usePreferencesStore((s) => s.language);
  const schoolId = useManagedSchoolId();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = parsePage(params.get('page'));
  const [adding, setAdding] = useState(false);

  // One-time message handed over by the details page after a link was ended (cleared from history).
  const endedName = (location.state as { linkEnded?: string } | null)?.linkEnded;
  const [notice, setNotice] = useState<string | null>(endedName ? t('list.linkEnded', { name: endedName }) : null);
  useEffect(() => {
    if (endedName) navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, [endedName, navigate, location.pathname, location.search]);

  const list = useParentsList(schoolId, page);
  const parents = list.data?.data ?? [];
  const meta = list.data?.meta;

  const goTo = (next: number) => {
    setParams(
      (previous) => {
        const copy = new URLSearchParams(previous);
        if (next <= 1) copy.delete('page');
        else copy.set('page', String(next));
        return copy;
      },
      { replace: false },
    );
    window.scrollTo({ top: 0 });
  };

  // The last page can disappear (e.g. after ending a link): move to the new last page.
  useEffect(() => {
    if (meta && page > Math.max(1, meta.totalPages)) {
      setParams(
        (previous) => {
          const copy = new URLSearchParams(previous);
          if (meta.totalPages <= 1) copy.delete('page');
          else copy.set('page', String(meta.totalPages));
          return copy;
        },
        { replace: true },
      );
    }
  }, [meta, page, setParams]);

  const addButton = (
    <Button variant="primary" onClick={() => setAdding(true)} disabled={schoolId === null}>
      <PlusIcon />
      {t('list.add')}
    </Button>
  );

  let body: ReactNode;
  if (schoolId === null) {
    body = <EmptyState title={t('school.missingTitle')} description={t('school.missingBody')} />;
  } else if (list.isPending) {
    body = <ParentLedgerSkeleton />;
  } else if (list.isError && !list.data) {
    body = (
      <div className="stack-sm">
        <ApiErrorAlert error={list.error} title={t('list.errorTitle')} />
        <div>
          <Button onClick={() => void list.refetch()}>{t('list.retry')}</Button>
        </div>
      </div>
    );
  } else if (meta && meta.total === 0) {
    body = (
      <div className={styles.empty}>
        <span className={styles.emptyMark} aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8.5" r="3.5" />
            <path d="M5 19.5c.8-3.3 3.6-5 7-5s6.2 1.7 7 5" />
          </svg>
        </span>
        <h2 className={styles.emptyTitle}>{t('list.emptyTitle')}</h2>
        <p className={`muted ${styles.emptyBody}`}>{t('list.emptyBody')}</p>
        {addButton}
      </div>
    );
  } else {
    body = (
      <>
        {list.isError && <ApiErrorAlert error={list.error} title={t('list.errorTitle')} />}
        <ParentLedger
          parents={parents}
          busy={list.isFetching}
          footer={
            meta && (
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                totalLabel={t('list.total', { count: formatNumber(meta.total, language) })}
                busy={list.isFetching}
                onChange={goTo}
              />
            )
          }
        />
      </>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeading title={t('list.title')} description={t('list.description')} actions={addButton} />
      {notice && (
        <Alert variant="success">
          <span className={styles.noticeRow}>
            <span>{notice}</span>
            <Button variant="ghost" onClick={() => setNotice(null)}>
              {t('list.dismiss')}
            </Button>
          </span>
        </Alert>
      )}
      {body}
      {adding && schoolId && <RegisterParentSheet schoolId={schoolId} onClose={() => setAdding(false)} />}
    </div>
  );
}
