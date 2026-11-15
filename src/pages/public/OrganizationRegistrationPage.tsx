import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { RateLimitNotice } from '@/components/auth/RateLimitNotice';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { ApplicantFields } from '@/components/registration/ApplicantFields';
import { OptionSelect } from '@/components/registration/OptionSelect';
import { RegistrationStepper } from '@/components/registration/RegistrationStepper';
import { ReviewList } from '@/components/registration/ReviewList';
import { Button, ButtonLink, FormField, SuccessPanel, TextInput } from '@/components/ui';
import { useCountries, useGovernorates } from '@/hooks/useGeography';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useWizard } from '@/hooks/useWizard';
import { useZodForm } from '@/hooks/useZodForm';
import { organizationSchema } from '@/schemas/registration';
import { isApiError } from '@/services/api';
import { ORGANIZATION_ERROR_STEP, stepForField } from '@/services/registration/errorSteps';
import { buildOrganizationPayload, type OrganizationFormValues } from '@/services/registration/payloads';
import { registrationApi } from '@/services/registration/registrationApi';
import { useAuthStore } from '@/store';
import { applyApiFieldErrors } from '@/utils/forms';
import type { Path } from 'react-hook-form';

const STEP_LABELS = ['applicant', 'organization', 'review'] as const;

export default function OrganizationRegistrationPage() {
  const { t } = useTranslation('registration');
  const authenticated = useAuthStore((s) => s.status === 'authenticated');
  const accountPhone = useAuthStore((s) => s.user?.phone ?? '');
  const schema = useMemo(() => organizationSchema(!authenticated), [authenticated]);
  const form = useZodForm(schema, {
    defaultValues: {
      applicant: { name: '', phone: authenticated ? accountPhone : '', password: '' },
      organization: { name: '', countryId: '', governorateId: '', centerName: '', villageName: '' },
    },
  });
  const { register, setValue, trigger, watch, handleSubmit, formState: { errors } } = form;
  const wizard = useWizard(STEP_LABELS.length);
  const rate = useRateLimit();

  const countryId = watch('organization.countryId');
  const governorateId = watch('organization.governorateId');
  const countries = useCountries();
  const governorates = useGovernorates(countryId ? { countryId } : null);

  const stepFields: Path<OrganizationFormValues>[][] = [
    ['applicant.name', 'applicant.phone', ...(authenticated ? [] : (['applicant.password'] as const))],
    ['organization.name', 'organization.countryId', 'organization.governorateId', 'organization.centerName', 'organization.villageName'],
    [],
  ];

  const mutation = useMutation({
    mutationFn: (values: OrganizationFormValues) =>
      registrationApi.registerOrganization(buildOrganizationPayload(values, authenticated)),
    onError: (error) => {
      rate.track(error);
      if (!isApiError(error)) return;
      applyApiFieldErrors(error, form.setError);
      const byField = error.fieldErrors[0]
        ? stepForField(error.fieldErrors[0].field, [['applicant', 0], ['organization', 1]])
        : undefined;
      const step = byField ?? (error.code ? ORGANIZATION_ERROR_STEP[error.code] : undefined);
      if (step !== undefined) wizard.goTo(step);
    },
  });

  const goNext = async () => {
    if (await trigger(stepFields[wizard.index])) wizard.next();
  };

  if (mutation.isSuccess) {
    const { organization } = mutation.data;
    return (
      <AuthPageLayout title={t('orgPage.title')} wide>
        <SuccessPanel
          title={t('orgPage.successTitle')}
          description={authenticated ? t('orgPage.successSignedIn') : t('orgPage.successAnonymous')}
          details={[
            { label: t('orgPage.name'), value: organization.name },
            { label: t('orgPage.code'), value: <bdi dir="ltr">{organization.code}</bdi> },
            { label: t('orgPage.status'), value: t(`status.${organization.status}`, { defaultValue: organization.status }) },
          ]}
        >
          {authenticated ? (
            <ButtonLink variant="primary" to={ROUTES.myDevices}>
              {t('orgPage.continue')}
            </ButtonLink>
          ) : (
            <ButtonLink variant="primary" to={ROUTES.login}>
              {t('landing.signIn')}
            </ButtonLink>
          )}
        </SuccessPanel>
      </AuthPageLayout>
    );
  }

  const countryName = countries.data?.find((c) => c.id === countryId)?.name ?? '—';
  const governorateName = governorates.data?.find((g) => g.id === governorateId)?.name ?? '—';
  const values = watch();
  const dash = (v?: string) => (v && v.trim() ? v.trim() : '—');

  return (
    <AuthPageLayout
      wide
      title={t('orgPage.title')}
      subtitle={t('orgPage.subtitle')}
      footer={
        <Link className="link" to={ROUTES.register}>
          {t('backToRegister')}
        </Link>
      }
    >
      <div className="stack">
        <RegistrationStepper steps={STEP_LABELS.map((s) => t(`steps.${s}`))} current={wizard.index} />
        <h2 className="wizard-title" tabIndex={-1} ref={wizard.headingRef}>
          {t(`steps.${STEP_LABELS[wizard.index]!}`)}
        </h2>
        {mutation.error && <ApiErrorAlert error={mutation.error} />}
        <RateLimitNotice secondsLeft={rate.secondsLeft} />

        <form noValidate className="stack" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          {wizard.index === 0 && <ApplicantFields form={form} authenticated={authenticated} />}

          {wizard.index === 1 && (
            <div className="stack">
              <FormField label={t('organization.name')} error={errors.organization?.name?.message}>
                {(c) => <TextInput {...c} {...register('organization.name')} />}
              </FormField>
              <OptionSelect
                label={t('organization.country')}
                query={countries}
                enabled
                error={errors.organization?.countryId?.message}
                registration={register('organization.countryId', {
                  // The governorate belongs to the country: clear it when the country changes.
                  onChange: () => setValue('organization.governorateId', ''),
                })}
              />
              <OptionSelect
                label={t('organization.governorate')}
                query={governorates}
                enabled={Boolean(countryId)}
                disabledHint={t('organization.selectCountryFirst')}
                error={errors.organization?.governorateId?.message}
                registration={register('organization.governorateId')}
              />
              <FormField label={t('organization.centerName')} optional error={errors.organization?.centerName?.message}>
                {(c) => <TextInput {...c} {...register('organization.centerName')} />}
              </FormField>
              <FormField label={t('organization.villageName')} optional error={errors.organization?.villageName?.message}>
                {(c) => <TextInput {...c} {...register('organization.villageName')} />}
              </FormField>
            </div>
          )}

          {wizard.index === 2 && (
            <div className="stack">
              <p className="muted">{t('review.hint')}</p>
              <ReviewList
                sections={[
                  {
                    title: t('steps.applicant'),
                    editLabel: t('review.edit'),
                    onEdit: () => wizard.goTo(0),
                    rows: [
                      { label: t('applicant.name'), value: dash(values.applicant.name) },
                      { label: t('applicant.phone'), value: <bdi dir="ltr">{dash(values.applicant.phone)}</bdi> },
                      ...(authenticated ? [] : [{ label: t('applicant.password'), value: '••••' }]),
                    ],
                  },
                  {
                    title: t('steps.organization'),
                    editLabel: t('review.edit'),
                    onEdit: () => wizard.goTo(1),
                    rows: [
                      { label: t('organization.name'), value: dash(values.organization.name) },
                      { label: t('organization.country'), value: countryName },
                      { label: t('organization.governorate'), value: governorateName },
                      { label: t('organization.centerName'), value: dash(values.organization.centerName) },
                      { label: t('organization.villageName'), value: dash(values.organization.villageName) },
                    ],
                  },
                ]}
              />
            </div>
          )}

          <div className="wizard-actions">
            {wizard.index > 0 ? (
              <Button onClick={wizard.back} disabled={mutation.isPending}>
                {t('actions.back')}
              </Button>
            ) : (
              <span />
            )}
            {wizard.index < STEP_LABELS.length - 1 ? (
              <Button variant="primary" onClick={() => void goNext()}>
                {t('actions.next')}
              </Button>
            ) : (
              <Button type="submit" variant="primary" loading={mutation.isPending} disabled={rate.secondsLeft > 0}>
                {t('orgPage.submit')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </AuthPageLayout>
  );
}
