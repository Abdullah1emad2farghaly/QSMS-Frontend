import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { RateLimitNotice } from '@/components/auth/RateLimitNotice';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { Alert, Button, FormField, OtpInput } from '@/components/ui';
import { useCountdownTo } from '@/hooks/useCountdown';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useZodForm } from '@/hooks/useZodForm';
import { verifyOtpSchema, type VerifyOtpFormValues } from '@/schemas/auth';
import { authApi } from '@/services/auth/authApi';
import { useRecoveryStore } from '@/store';
import { normalizeDigits } from '@/utils/digits';

const mmss = (total: number) => `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;

export default function VerifyOtpPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const phone = useRecoveryStore((s) => s.phone);
  const otpExpiresAt = useRecoveryStore((s) => s.otpExpiresAt);
  const secondsLeft = useCountdownTo(otpExpiresAt);
  const rate = useRateLimit();
  const form = useZodForm(verifyOtpSchema, { defaultValues: { otp: '' } });
  const { register, handleSubmit, formState: { errors } } = form;

  const mutation = useMutation({
    mutationFn: (values: VerifyOtpFormValues) =>
      authApi.verifyPasswordRecoveryOtp({ phone, otp: normalizeDigits(values.otp.trim()) }),
    onSuccess: (data) => {
      useRecoveryStore.getState().setVerified(data.resetToken, data.resetTokenExpiresAt);
      navigate(ROUTES.resetPassword, { replace: true });
    },
    onError: (error) => rate.track(error),
  });

  // The phone is kept in memory from the previous step; without it there is nothing to verify.
  if (!phone) return <Navigate to={ROUTES.forgotPassword} replace />;

  return (
    <AuthPageLayout
      title={t('verify.title')}
      subtitle={t('verify.subtitle', { phone })}
      footer={
        <Link className="link" to={ROUTES.forgotPassword}>
          {t('verify.requestNew')}
        </Link>
      }
    >
      <form className="stack" noValidate onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Alert variant="info">{t('verify.genericNotice')}</Alert>
        {otpExpiresAt !== null &&
          (secondsLeft > 0 ? (
            <p className="muted" aria-live="off">
              {t('verify.validFor')} <bdi dir="ltr">{mmss(secondsLeft)}</bdi>
            </p>
          ) : (
            <Alert variant="warning">{t('verify.expired')}</Alert>
          ))}
        {mutation.error && <ApiErrorAlert error={mutation.error} />}
        <RateLimitNotice secondsLeft={rate.secondsLeft} />
        <FormField label={t('verify.otp')} hint={t('verify.otpHint')} error={errors.otp?.message}>
          {(c) => <OtpInput {...c} {...register('otp')} />}
        </FormField>
        <Button type="submit" variant="primary" block loading={mutation.isPending} disabled={rate.secondsLeft > 0}>
          {t('verify.submit')}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
