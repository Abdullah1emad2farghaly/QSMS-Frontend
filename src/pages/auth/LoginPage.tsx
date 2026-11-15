import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';
import { resolvePostLoginPath } from '@/app/routes/postLogin';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { RateLimitNotice } from '@/components/auth/RateLimitNotice';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { Alert, Button, FormField, PasswordInput, PhoneInput } from '@/components/ui';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useZodForm } from '@/hooks/useZodForm';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';
import { isApiError } from '@/services/api';
import { login } from '@/services/auth/authActions';
import { useAuthStore, useRecoveryStore } from '@/store';
import { normalizeDigits } from '@/utils/digits';
import { applyApiFieldErrors } from '@/utils/forms';

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();
  const endedReason = useAuthStore((s) => s.endedReason);
  const rate = useRateLimit();
  const passwordReset = (location.state as { passwordReset?: boolean } | null)?.passwordReset === true;

  const form = useZodForm(loginSchema, { defaultValues: { phone: '', password: '' } });
  const { register, handleSubmit, setError, formState: { errors } } = form;

  // A fresh visit to sign-in abandons any half-finished password recovery (token is memory-only anyway).
  useEffect(() => {
    useRecoveryStore.getState().clear();
    return () => useAuthStore.getState().dismissEndedReason();
  }, []);

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => login({ phone: normalizeDigits(values.phone.trim()), password: values.password }),
    onSuccess: (data) =>
      navigate(
        resolvePostLoginPath(location.state, {
          mustChangePassword: data.mustChangePassword,
          roles: data.roles ?? [],
          activeRole: data.activeRole ?? null,
        }),
        { replace: true },
      ),
    onError: (error) => {
      rate.track(error);
      if (isApiError(error)) applyApiFieldErrors(error, setError);
    },
  });

  return (
    <AuthPageLayout
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <>
          <Link className="link" to={ROUTES.forgotPassword}>
            {t('login.forgot')}
          </Link>
          <span className="muted">
            {t('login.noAccount')}{' '}
            <Link className="link" to={ROUTES.register}>
              {t('login.register')}
            </Link>
          </span>
        </>
      }
    >
      <form className="stack" noValidate onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        {endedReason === 'expired' && <Alert variant="warning">{t('login.endedNotice')}</Alert>}
        {passwordReset && <Alert variant="success">{t('login.passwordResetDone')}</Alert>}
        {mutation.error && <ApiErrorAlert error={mutation.error} />}
        <RateLimitNotice secondsLeft={rate.secondsLeft} />

        <FormField label={t('login.phone')} error={errors.phone?.message}>
          {(c) => <PhoneInput {...c} placeholder="01012345678" {...register('phone')} />}
        </FormField>
        <FormField label={t('login.password')} error={errors.password?.message}>
          {(c) => <PasswordInput {...c} autoComplete="current-password" {...register('password')} />}
        </FormField>
        <Button type="submit" variant="primary" block loading={mutation.isPending} disabled={rate.secondsLeft > 0}>
          {t('login.submit')}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
