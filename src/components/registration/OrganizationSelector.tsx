import { useTranslation } from 'react-i18next';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { useOrganizationLookup } from '@/hooks/useGeography';
import type { OrganizationOption } from '@/types';
import styles from './OrganizationSelector.module.css';

interface OrganizationSelectorProps {
  selected: OrganizationOption | null;
  onSelect: (organization: OrganizationOption) => void;
  error?: string;
}

/** Paginated, accessible radio list of eligible organizations with "load more". */
export function OrganizationSelector({ selected, onSelect, error }: OrganizationSelectorProps) {
  const { t } = useTranslation('registration');
  const query = useOrganizationLookup();
  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.meta.total;

  return (
    <div className="stack-sm">
      <p className="muted">{t('organizationSelector.intro')}</p>

      {query.isPending && (
        <div className="stack-sm" aria-busy="true" aria-label={t('organizationSelector.loading')}>
          <Skeleton height="3rem" />
          <Skeleton height="3rem" />
          <Skeleton height="3rem" />
        </div>
      )}

      {query.isError && (
        <div className="stack-sm">
          <ApiErrorAlert error={query.error} />
          <div>
            <Button onClick={() => void query.refetch()} loading={query.isRefetching}>
              {t('select.retry')}
            </Button>
          </div>
        </div>
      )}

      {query.isSuccess && items.length === 0 && <EmptyState title={t('organizationSelector.empty')} />}

      {items.length > 0 && (
        <>
          <div role="radiogroup" aria-label={t('organizationSelector.label')} className={styles.list}>
            {items.map((organization) => {
              const checked = selected?.id === organization.id;
              return (
                <label key={organization.id} className={`${styles.option} ${checked ? styles.checked : ''}`.trim()}>
                  <input
                    type="radio"
                    name="organization"
                    className={styles.radio}
                    checked={checked}
                    onChange={() => onSelect(organization)}
                  />
                  <span className={styles.name}>{organization.name}</span>
                </label>
              );
            })}
          </div>
          {typeof total === 'number' && (
            <p className="muted" aria-live="polite">
              {t('organizationSelector.shown', { shown: items.length, total })}
            </p>
          )}
          {query.hasNextPage && (
            <div>
              <Button onClick={() => void query.fetchNextPage()} loading={query.isFetchingNextPage}>
                {t('organizationSelector.loadMore')}
              </Button>
            </div>
          )}
        </>
      )}

      {selected && (
        <p className={styles.selected} aria-live="polite">
          {t('organizationSelector.selected')} <strong>{selected.name}</strong>
        </p>
      )}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
