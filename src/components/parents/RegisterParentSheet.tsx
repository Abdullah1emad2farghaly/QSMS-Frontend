import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PARENT_ROUTE_BUILDERS } from '@/app/routes/paths';
import { RateLimitNotice } from '@/components/auth/RateLimitNotice';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { Button, ButtonLink, FormField, PhoneInput, SuccessPanel, TextInput } from '@/components/ui';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useRegisterParent } from '@/hooks/useParents';
import { useZodForm } from '@/hooks/useZodForm';
import { registerParentSchema, type RegisterParentFormValues } from '@/schemas/parents';
import { isApiError } from '@/services/api';
import { getParentErrorMessage, PARENT_ERROR_FIELD } from '@/utils/parentErrors';
import { AddressLine } from './ParentParts';
import { Sheet } from './Sheet';

const FIELDS = ['name', 'phone', 'address'] as const;
const EMPTY: RegisterParentFormValues = { name: '', phone: '', address: '' };

/** Register a parent (name, phone, address as free text). The backend creates or reuses the account. */
export function RegisterParentSheet({ schoolId, onClose }: { schoolId: string; onClose: () => void }) {
  const { t } = useTranslation('parents');
  const formId = useId();
  const rate = useRateLimit();
  const [alertError, setAlertError] = useState<unknown>(null);
  const form = useZodForm(registerParentSchema, { defaultValues: EMPTY });
  const { register, handleSubmit, setError, reset, formState: { errors } } = form;
  const mutation = useRegisterParent(schoolId);

  const submit = handleSubmit((values) => {
    setAlertError(null);
    mutation.mutate(values, {
      onError: (error) => {
        rate.track(error);
        if (!isApiError(error)) return setAlertError(error);
        let placed = false;
        const field = error.code ? PARENT_ERROR_FIELD[error.code] : undefined;
        if (field) {
          setError(field, { type: error.code, message: getParentErrorMessage(error) });
          placed = true;
        }
        for (const entry of error.fieldErrors) {
          const known = FIELDS.find((f) => f === entry.field);
          if (known) {
            setError(known, { type: entry.code, message: entry.message });
            placed = true;
          }
        }
        // Everything else (identity/account/organization conflicts, rate limits, server errors) is a form-level message.
        if (!placed) setAlertError(error);
      },
    });
  });

  const created = mutation.data;
  if (created) {
    const { parent, accountCreated } = created;
    return (
      <Sheet title={t('register.title')} onClose={onClose}>
        <SuccessPanel
          title={t('register.successTitle', { name: parent.name })}
          description={accountCreated ? t('register.successNewAccount') : t('register.successExistingAccount')}
          details={[
            { label: t('list.columns.phone'), value: <bdi dir="ltr">{parent.phone}</bdi> },
            { label: t('list.columns.address'), value: <AddressLine address={parent.address} /> },
          ]}
        >
          <div className="success-panel-actions">
            <ButtonLink variant="primary" to={PARENT_ROUTE_BUILDERS.details(parent.id)}>
              {t('register.viewParent')}
            </ButtonLink>
            <Button
              onClick={() => {
                mutation.reset();
                reset(EMPTY);
              }}
            >
              {t('register.addAnother')}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              {t('register.close')}
            </Button>
          </div>
        </SuccessPanel>
      </Sheet>
    );
  }

  return (
    <Sheet
      title={t('register.title')}
      description={t('register.description')}
      onClose={onClose}
      busy={mutation.isPending}
      footer={
        <>
          <Button onClick={onClose} disabled={mutation.isPending}>
            {t('register.close')}
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={mutation.isPending} disabled={rate.secondsLeft > 0}>
            {t('register.submit')}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate className="stack" onSubmit={submit}>
        {alertError !== null && <ApiErrorAlert error={alertError} message={getParentErrorMessage(alertError)} />}
        <RateLimitNotice secondsLeft={rate.secondsLeft} />
        <FormField label={t('register.name')} hint={t('register.nameHint')} error={errors.name?.message}>
          {(c) => <TextInput {...c} autoComplete="name" {...register('name')} />}
        </FormField>
        <FormField label={t('register.phone')} hint={t('register.phoneHint')} error={errors.phone?.message}>
          {(c) => <PhoneInput {...c} placeholder="01001234567" {...register('phone')} />}
        </FormField>
        <FormField label={t('register.address')} hint={t('register.addressHint')} error={errors.address?.message}>
          {(c) => <TextInput {...c} placeholder={t('register.addressPlaceholder')} autoComplete="off" {...register('address')} />}
        </FormField>
      </form>
    </Sheet>
  );
}
