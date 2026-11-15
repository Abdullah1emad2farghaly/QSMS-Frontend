import type { UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { Button, FormField, Select } from '@/components/ui';
import type { UseFormRegisterReturn } from 'react-hook-form';
import type { GeographyOption } from '@/types';

interface OptionSelectProps {
  label: string;
  registration: UseFormRegisterReturn;
  query: UseQueryResult<GeographyOption[]>;
  /** False while a parent selection is missing (the query is not running). */
  enabled: boolean;
  disabledHint?: string;
  error?: string;
}

/**
 * Select fed by a geography query with loading, error (with retry) and empty states.
 * Option names are shown exactly as the backend stores them (Arabic) in every locale.
 */
export function OptionSelect({ label, registration, query, enabled, disabledHint, error }: OptionSelectProps) {
  const { t } = useTranslation('registration');
  const loading = enabled && query.isPending;
  const options = query.data ?? [];
  const empty = enabled && query.isSuccess && options.length === 0;
  const disabled = !enabled || loading || query.isError || empty;

  return (
    <div className="stack-sm">
      <FormField label={label} error={error} hint={!enabled ? disabledHint : undefined}>
        {(c) => (
          <Select {...c} disabled={disabled} aria-busy={loading || undefined} {...registration}>
            <option value="">{loading ? t('select.loading') : t('select.placeholder')}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        )}
      </FormField>
      {empty && <p className="muted">{t('select.empty')}</p>}
      {enabled && query.isError && (
        <div className="stack-sm">
          <ApiErrorAlert error={query.error} />
          <div>
            <Button onClick={() => void query.refetch()} loading={query.isRefetching}>
              {t('select.retry')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
