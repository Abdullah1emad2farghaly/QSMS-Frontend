import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@/components/ui/Select';
import { useRoleState } from '@/hooks/useRoleState';
import { useSwitchRole } from '@/hooks/useSwitchRole';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { isApiError } from '@/services/api';
import { isLandingRole } from '@/utils/roles';

/**
 * Switches the active role of THIS session. Lists only roles the backend assigned to the user;
 * switches immediately (no confirmation) and never calls the API for the already-active role.
 * A single-role account just sees its role name.
 */
export function RoleSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation('roles');
  const id = useId();
  const { available, active } = useRoleState();
  const mutation = useSwitchRole();

  if (available.length === 0) return null;
  if (available.length === 1) {
    return <span className={`role-badge ${className ?? ''}`.trim()}>{t(`names.${available[0]!}`)}</span>;
  }

  return (
    <div className={`role-switcher ${className ?? ''}`.trim()}>
      <label htmlFor={id} className="visually-hidden">
        {t('switcher.label')}
      </label>
      <Select
        id={id}
        value={active ?? ''}
        disabled={mutation.isPending}
        aria-busy={mutation.isPending || undefined}
        data-testid="role-switcher"
        onChange={(event) => {
          const role = event.target.value;
          if (!isLandingRole(role) || role === active) return;
          mutation.mutate(role);
        }}
      >
        {active === null && (
          <option value="" disabled>
            {t('switcher.choose')}
          </option>
        )}
        {available.map((role) => (
          <option key={role} value={role}>
            {t(`names.${role}`)}
          </option>
        ))}
      </Select>
      {mutation.isError && (
        <span className="field-error" role="alert">
          {isApiError(mutation.error) ? getApiErrorMessage(mutation.error) : t('switcher.error')}
        </span>
      )}
    </div>
  );
}
