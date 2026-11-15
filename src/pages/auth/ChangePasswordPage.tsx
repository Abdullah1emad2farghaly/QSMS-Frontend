import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES, POST_LOGIN_FALLBACK } from '@/app/routes/paths';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { Alert, Button, ButtonLink, FormField, PasswordInput, SuccessPanel } from '@/components/ui';
import { useZodForm } from '@/hooks/useZodForm';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/schemas/auth';
import { isApiError } from '@/services/api';
import { changePassword } from '@/services/auth/authActions';
import { useAuthStore } from '@/store';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { applyApiFieldErrors } from '@/utils/forms';

/** Field-level placement of documented business errors. */
const FIELD_BY_CODE: Record<string, 'currentPassword' | 'newPassword'> = {
  CURRENT_PASSWORD_INCORRECT: 'currentPassword',
  INVALID_PASSWORD: 'newPassword',
  NEW_PASSWORD_SAME_AS_CURRENT: 'newPassword',
};

export default function ChangePasswordPage() {
  const { t } = useTranslation('auth');
  const mustChange = useAuthStore((s) => s.mustChangePassword);
  const [forcedAtStart] = useState(mustChange);
  const [done, setDone] = useState(false);
  const form = useZodForm(changePasswordSchema, {
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const { register, handleSubmit, setError, reset, formState: { errors } } = form;

  const mutation = useMutation({
    // Confirm password is frontend-only and is never sent.
    mutationFn: (values: ChangePasswordFormValues) =>
      changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
    onSuccess: () => {
      reset();
      setDone(true);
    },
    onError: (error) => {
      if (!isApiError(error)) return;
      applyApiFieldErrors(error, setError);
      const field = error.code ? FIELD_BY_CODE[error.code] : undefined;
      if (field) setError(field, { message: getApiErrorMessage(error) });
    },
  });

  if (done) {
    return (
      <AuthPageLayout title={t('changePassword.title')} wide>
        <SuccessPanel
          title={t('changePassword.successTitle')}
          description={t('changePassword.successBody')}
        >
          <ButtonLink variant="primary" to={forcedAtStart ? POST_LOGIN_FALLBACK : ROUTES.myDevices}>
            {t('changePassword.continue')}
          </ButtonLink>
        </SuccessPanel>
      </AuthPageLayout>
    );
  }

  const placedInline = mutation.error && isApiError(mutation.error) && mutation.error.code !== undefined && mutation.error.code in FIELD_BY_CODE;

  return (
    <AuthPageLayout
      title={t('changePassword.title')}
      subtitle={forcedAtStart ? undefined : t('changePassword.subtitle')}
      footer={forcedAtStart ? <LogoutButton variant="ghost" /> : undefined}
    >
      <form className="stack" noValidate onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        {forcedAtStart && (
          <Alert variant="warning" title={t('changePassword.forcedTitle')}>
            {t('changePassword.forcedBody')}
          </Alert>
        )}
        {mutation.error && !placedInline && <ApiErrorAlert error={mutation.error} />}
        <FormField label={t('changePassword.current')} error={errors.currentPassword?.message}>
          {(c) => <PasswordInput {...c} autoComplete="current-password" {...register('currentPassword')} />}
        </FormField>
        <FormField label={t('changePassword.new')} hint={t('passwordPolicy')} error={errors.newPassword?.message}>
          {(c) => <PasswordInput {...c} autoComplete="new-password" {...register('newPassword')} />}
        </FormField>
        <FormField label={t('changePassword.confirm')} error={errors.confirmPassword?.message}>
          {(c) => <PasswordInput {...c} autoComplete="new-password" {...register('confirmPassword')} />}
        </FormField>
        <p className="muted">{t('changePassword.otherDevicesNote')}</p>
        <Button type="submit" variant="primary" block loading={mutation.isPending}>
          {t('changePassword.submit')}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
