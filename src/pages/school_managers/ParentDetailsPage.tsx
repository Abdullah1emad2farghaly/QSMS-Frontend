import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PARENTS_ROUTES } from '@/app/routes/paths';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { EditAddressSheet } from '@/components/parents/EditAddressSheet';
import { BackIcon, Monogram, PencilIcon } from '@/components/parents/ParentParts';
import { ParentStudentsSection } from '@/components/parents/ParentStudentsSection';
import { Alert, Button, ConfirmationDialog, EmptyState, Skeleton } from '@/components/ui';
import { useManagedSchoolId } from '@/hooks/useManagedSchoolId';
import { useEndParentSchoolLink, useParent } from '@/hooks/useParents';
import { usePreferencesStore } from '@/store';
import { formatDate, formatNumber } from '@/utils/format';
import { getParentErrorMessage } from '@/utils/parentErrors';
import styles from './ParentDetailsPage.module.css';

/** SCHOOL_MANAGER · one parent: profile, address (editable), students, and ending the link with this school. */
export default function ParentDetailsPage() {
  const { t } = useTranslation('parents');
  const language = usePreferencesStore((s) => s.language);
  const { parentId } = useParams();
  const navigate = useNavigate();
  const schoolId = useManagedSchoolId();
  // No managed school (not reported for this session): the module is unavailable and nothing is requested.
  const query = useParent(schoolId ? parentId : undefined);
  const endLink = useEndParentSchoolLink(parentId ?? '', schoolId);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);

  const back = (
    <Link to={PARENTS_ROUTES.list} className={`link ${styles.back}`}>
      <span className={styles.backIcon}>
        <BackIcon />
      </span>
      {t('details.back')}
    </Link>
  );

  if (schoolId === null) {
    return (
      <div className={styles.page}>
        {back}
        <EmptyState title={t('school.missingTitle')} description={t('school.missingBody')} />
      </div>
    );
  }

  if (query.isPending) {
    return (
      <div className={styles.page} aria-busy="true">
        {back}
        <div className={styles.profile}>
          <span className="skeleton" style={{ inlineSize: '4rem', blockSize: '4rem', borderRadius: '50%' }} aria-hidden="true" />
          <div className={styles.skeletonBlock} style={{ flex: 1 }}>
            <Skeleton height="1.5rem" width="60%" />
            <Skeleton height="1rem" width="35%" />
          </div>
        </div>
        <Skeleton height="12rem" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className={styles.page}>
        {back}
        <ApiErrorAlert error={query.error} title={t('details.loadError')} />
        <div>
          <Button onClick={() => void query.refetch()}>{t('list.retry')}</Button>
        </div>
      </div>
    );
  }

  const parent = query.data;
  const { address } = parent;
  const linked = parent.schoolIds.includes(schoolId);
  const trail = [
    { key: 'governorate', label: t('address.governorate'), value: address.governorateName },
    { key: 'center', label: t('address.center'), value: address.centerName },
    { key: 'village', label: t('address.village'), value: address.villageName },
  ].filter((level) => level.value && level.value.trim());

  return (
    <div className={styles.page}>
      {back}

      <header className={styles.profile}>
        <Monogram name={parent.name} size="lg" />
        <div className={styles.identity}>
          <h1 className={styles.name}>{parent.name}</h1>
          <p className={styles.phone}>
            <bdi dir="ltr">{parent.phone}</bdi>
          </p>
        </div>
      </header>

      {saved && <Alert variant="success">{t('editAddress.saved')}</Alert>}

      <div className={styles.layout}>
        <aside className={styles.aside}>
          <section className="card" aria-labelledby="parent-address-title">
            <div className={styles.cardHead}>
              <h2 id="parent-address-title" className={styles.cardTitle}>
                {t('details.address')}
              </h2>
              <Button
                onClick={() => {
                  setSaved(false);
                  setEditing(true);
                }}
              >
                <PencilIcon />
                {t('details.editAddress')}
              </Button>
            </div>
            <ol className={styles.trail}>
              {trail.map((level) => (
                <li key={level.key}>
                  <span className={styles.level}>{level.label}</span>
                  <span className={styles.place}>{level.value}</span>
                </li>
              ))}
            </ol>
            <p className={styles.since}>{t('details.addressSince', { date: formatDate(address.since, language) })}</p>
          </section>

          <section className="card" aria-labelledby="parent-profile-title">
            <h2 id="parent-profile-title" className={styles.cardTitle} style={{ marginBlockEnd: 'var(--space-3)' }}>
              {t('details.profile')}
            </h2>
            <dl className={styles.facts}>
              <div className={styles.fact}>
                <dt>{t('details.phone')}</dt>
                <dd>
                  <bdi dir="ltr">{parent.phone}</bdi>
                </dd>
              </div>
              <div className={styles.fact}>
                <dt>{t('details.registered')}</dt>
                <dd>{formatDate(parent.createdAt, language)}</dd>
              </div>
              <div className={styles.fact}>
                <dt>{t('details.updated')}</dt>
                <dd>{formatDate(parent.updatedAt, language)}</dd>
              </div>
              <div className={styles.fact}>
                <dt>{t('details.schools')}</dt>
                <dd>{formatNumber(parent.schoolIds.length, language)}</dd>
              </div>
            </dl>
          </section>

          {linked ? (
            <section className={styles.endLink} aria-label={t('details.endLink')}>
              <p className="muted">{t('details.endLinkHint')}</p>
              <Button className={styles.endBtn} onClick={() => setConfirming(true)}>
                {t('details.endLink')}
              </Button>
            </section>
          ) : (
            <Alert variant="info">{t('details.notLinked')}</Alert>
          )}
        </aside>

        <div style={{ minInlineSize: 0 }}>
          <ParentStudentsSection parentId={parent.id} />
        </div>
      </div>

      {editing && (
        <EditAddressSheet
          parent={parent}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setSaved(true);
          }}
        />
      )}

      <ConfirmationDialog
        open={confirming}
        destructive
        title={t('endLink.dialogTitle', { name: parent.name })}
        confirmLabel={t('endLink.confirm')}
        loading={endLink.isPending}
        errorMessage={endLink.error ? getParentErrorMessage(endLink.error) : null}
        description={
          <div className="stack-sm">
            <p>{t('endLink.intro')}</p>
            <p>
              <strong>{t('endLink.keeps')}</strong>
            </p>
            <ul className={styles.keeps}>
              <li>{t('endLink.keep1')}</li>
              <li>{t('endLink.keep2')}</li>
              <li>{t('endLink.keep3')}</li>
            </ul>
            <p>{t('endLink.blocked')}</p>
          </div>
        }
        onConfirm={() =>
          endLink.mutate(undefined, {
            onSuccess: () => navigate(PARENTS_ROUTES.list, { replace: true, state: { linkEnded: parent.name } }),
          })
        }
        onCancel={() => {
          endLink.reset();
          setConfirming(false);
        }}
      />
    </div>
  );
}
