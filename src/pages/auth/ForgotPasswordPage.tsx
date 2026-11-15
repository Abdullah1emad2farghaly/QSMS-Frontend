import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { RateLimitNotice } from '@/components/auth/RateLimitNotice';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { Alert, Button, FormField, PhoneInput } from '@/components/ui';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useZodForm } from '@/hooks/useZodForm';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/schemas/auth';
import { authApi } from '@/services/auth/authApi';
import { useRecoveryStore } from '@/store';
import { normalizeDigits } from '@/utils/digits';

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const rate = useRateLimit();
  const form = useZodForm(forgotPasswordSchema, { defaultValues: { phone: useRecoveryStore.getState().phone } });
  const { register, handleSubmit, formState: { errors } } = form;

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) => {
      const phone = normalizeDigits(values.phone.trim());
      return authApi.requestPasswordRecovery({ phone }).then((data) => ({ phone, data }));
    },
    onSuccess: ({ phone, data }) => {
      // The answer is generic by design: never reveal whether the phone belongs to an account.
      useRecoveryStore.getState().setRequested(phone, data.expiresInSeconds);
      navigate(ROUTES.verifyOtp);
    },
    onError: (error) => rate.track(error),
  });

  return (
    <AuthPageLayout
      title={t('forgot.title')}
      subtitle={t('forgot.subtitle')}
      footer={
        <Link className="link" to={ROUTES.login}>
          {t('forgot.backToLogin')}
        </Link>
      }
    >
      <form className="stack" noValidate onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Alert variant="info">{t('forgot.privacyNote')}</Alert>
        {mutation.error && <ApiErrorAlert error={mutation.error} />}
        <RateLimitNotice secondsLeft={rate.secondsLeft} />
        <FormField label={t('login.phone')} error={errors.phone?.message}>
          {(c) => <PhoneInput {...c} placeholder="01012345678" {...register('phone')} />}
        </FormField>
        <Button type="submit" variant="primary" block loading={mutation.isPending} disabled={rate.secondsLeft > 0}>
          {t('forgot.submit')}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
