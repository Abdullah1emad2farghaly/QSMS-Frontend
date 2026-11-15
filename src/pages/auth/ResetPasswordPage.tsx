import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { Button, FormField, PasswordInput } from '@/components/ui';
import { useZodForm } from '@/hooks/useZodForm';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/schemas/auth';
import { hasErrorCode, isApiError } from '@/services/api';
import { authApi } from '@/services/auth/authApi';
import { useRecoveryStore } from '@/store';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { applyApiFieldErrors } from '@/utils/forms';

export default function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const resetToken = useRecoveryStore((s) => s.resetToken);
  const form = useZodForm(resetPasswordSchema, { defaultValues: { newPassword: '', confirmPassword: '' } });
  const { register, handleSubmit, setError, formState: { errors } } = form;

  const mutation = useMutation({
    // Confirm password is frontend-only: only the token and the new password are sent.
    mutationFn: (values: ResetPasswordFormValues) =>
      authApi.resetPassword({ resetToken: resetToken!, newPassword: values.newPassword }),
    onSuccess: () => {
      // All sessions were revoked server-side: sign in again and drop the temporary recovery data.
      // (Navigate first so this page does not re-render into the "no token" redirect.)
      navigate(ROUTES.login, { replace: true, state: { passwordReset: true } });
      useRecoveryStore.getState().clear();
    },
    onError: (error) => {
      if (!isApiError(error)) return;
      applyApiFieldErrors(error, setError);
      if (hasErrorCode(error, 'INVALID_PASSWORD')) setError('newPassword', { message: getApiErrorMessage(error) });
    },
  });

  if (!resetToken) return <Navigate to={ROUTES.forgotPassword} replace />;

  const tokenRejected = hasErrorCode(mutation.error, 'RESET_TOKEN_INVALID');
  const inlineHandled = hasErrorCode(mutation.error, 'INVALID_PASSWORD');

  return (
    <AuthPageLayout
      title={t('reset.title')}
      subtitle={t('reset.subtitle')}
      footer={
        <Link className="link" to={ROUTES.login}>
          {t('forgot.backToLogin')}
        </Link>
      }
    >
      <form className="stack" noValidate onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        {mutation.error && !inlineHandled && <ApiErrorAlert error={mutation.error} />}
        {tokenRejected && (
          <Link className="link" to={ROUTES.forgotPassword}>
            {t('reset.startOver')}
          </Link>
        )}
        <FormField label={t('reset.newPassword')} hint={t('passwordPolicy')} error={errors.newPassword?.message}>
          {(c) => <PasswordInput {...c} autoComplete="new-password" {...register('newPassword')} />}
        </FormField>
        <FormField label={t('reset.confirmPassword')} error={errors.confirmPassword?.message}>
          {(c) => <PasswordInput {...c} autoComplete="new-password" {...register('confirmPassword')} />}
        </FormField>
        <Button type="submit" variant="primary" block loading={mutation.isPending} disabled={tokenRejected}>
          {t('reset.submit')}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
