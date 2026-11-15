import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RateLimitNotice } from '@/components/auth/RateLimitNotice';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { Button, FormField, TextInput } from '@/components/ui';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useUpdateParentAddress } from '@/hooks/useParents';
import { useZodForm } from '@/hooks/useZodForm';
import { editParentAddressSchema } from '@/schemas/parents';
import { isApiError } from '@/services/api';
import type { Parent } from '@/types';
import { getParentErrorMessage, PARENT_ERROR_FIELD } from '@/utils/parentErrors';
import { addressToRequestString } from '@/utils/parents';
import { Sheet } from './Sheet';

/** Corrects only the address (a plain string). Name, phone and everything else stay read-only elsewhere. */
export function EditAddressSheet({ parent, onClose, onSaved }: { parent: Parent; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation('parents');
  const formId = useId();
  const rate = useRateLimit();
  const [alertError, setAlertError] = useState<unknown>(null);
  const initial = addressToRequestString(parent.address);
  const form = useZodForm(editParentAddressSchema, { defaultValues: { address: initial } });
  const { register, handleSubmit, setError, watch, formState: { errors } } = form;
  const mutation = useUpdateParentAddress(parent.id);
  const unchanged = watch('address').trim() === initial.trim();

  const submit = handleSubmit((values) => {
    setAlertError(null);
    mutation.mutate(values.address, {
      onSuccess: onSaved,
      onError: (error) => {
        rate.track(error);
        if (!isApiError(error)) return setAlertError(error);
        const field = error.code ? PARENT_ERROR_FIELD[error.code] : undefined;
        const serverField = error.fieldErrors.find((f) => f.field === 'address');
        if (field === 'address') setError('address', { type: error.code, message: getParentErrorMessage(error) });
        else if (serverField) setError('address', { type: serverField.code, message: serverField.message });
        else setAlertError(error);
      },
    });
  });

  return (
    <Sheet
      title={t('editAddress.title')}
      description={t('editAddress.description')}
      onClose={onClose}
      busy={mutation.isPending}
      footer={
        <>
          <Button onClick={onClose} disabled={mutation.isPending}>
            {t('register.close')}
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={mutation.isPending} disabled={unchanged || rate.secondsLeft > 0}>
            {t('editAddress.save')}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate className="stack" onSubmit={submit}>
        {alertError !== null && <ApiErrorAlert error={alertError} message={getParentErrorMessage(alertError)} />}
        <RateLimitNotice secondsLeft={rate.secondsLeft} />
        <FormField
          label={t('editAddress.field')}
          hint={unchanged ? t('editAddress.unchanged') : t('register.addressHint')}
          error={errors.address?.message}
        >
          {(c) => <TextInput {...c} placeholder={t('register.addressPlaceholder')} autoComplete="off" {...register('address')} />}
        </FormField>
      </form>
    </Sheet>
  );
}
