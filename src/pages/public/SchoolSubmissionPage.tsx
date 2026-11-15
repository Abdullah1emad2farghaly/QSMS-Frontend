import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { RateLimitNotice } from '@/components/auth/RateLimitNotice';
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert';
import { ApplicantFields } from '@/components/registration/ApplicantFields';
import { GpsLocationCard } from '@/components/registration/GpsLocationCard';
import { OptionSelect } from '@/components/registration/OptionSelect';
import { OrganizationSelector } from '@/components/registration/OrganizationSelector';
import { RegistrationStepper } from '@/components/registration/RegistrationStepper';
import { ReviewList } from '@/components/registration/ReviewList';
import { Alert, Button, ButtonLink, FormField, SuccessPanel, TextInput } from '@/components/ui';
import { useGovernorates } from '@/hooks/useGeography';
import { useGeolocationCapture } from '@/hooks/useGeolocationCapture';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useWizard } from '@/hooks/useWizard';
import { useZodForm } from '@/hooks/useZodForm';
import { schoolSchema } from '@/schemas/registration';
import { isApiError } from '@/services/api';
import { SCHOOL_ERROR_STEP, stepForField } from '@/services/registration/errorSteps';
import { buildSchoolPayload, type SchoolFormValues } from '@/services/registration/payloads';
import { registrationApi } from '@/services/registration/registrationApi';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthStore } from '@/store';
import type { GpsReading, OrganizationOption } from '@/types';
import { formatNumber } from '@/utils/format';
import { applyApiFieldErrors } from '@/utils/forms';
import type { Path } from 'react-hook-form';

/** 0 applicant · 1 organization · 2 school details (governorate + school) · 3 location · 4 review */
const STEP_LABELS = ['applicant', 'organization', 'details', 'location', 'review'] as const;

export default function SchoolSubmissionPage() {
  const { t } = useTranslation('registration');
  const language = useLanguage();
  const authenticated = useAuthStore((s) => s.status === 'authenticated');
  const accountPhone = useAuthStore((s) => s.user?.phone ?? '');
  const schema = useMemo(() => schoolSchema(!authenticated), [authenticated]);
  const form = useZodForm(schema, {
    defaultValues: {
      applicant: { name: '', phone: authenticated ? accountPhone : '', password: '' },
      organizationId: '',
      school: { name: '', governorateId: '', centerName: '', villageName: '', gps: null },
    },
  });
  const { register, setValue, trigger, watch, handleSubmit, formState: { errors } } = form;
  const wizard = useWizard(STEP_LABELS.length);
  const rate = useRateLimit();
  const [organization, setOrganization] = useState<OrganizationOption | null>(null);

  const organizationId = watch('organizationId');
  const governorateId = watch('school.governorateId');
  const gps = watch('school.gps');
  // Governorates are loaded by organization: the organization decides the school's country.
  const governorates = useGovernorates(organizationId ? { organizationId } : null);
  const { state: gpsState, capture } = useGeolocationCapture((reading: GpsReading | null) =>
    setValue('school.gps', reading, { shouldValidate: true }),
  );

  const stepFields: Path<SchoolFormValues>[][] = [
    ['applicant.name', 'applicant.phone', ...(authenticated ? [] : (['applicant.password'] as const))],
    ['organizationId'],
    ['school.governorateId', 'school.name', 'school.centerName', 'school.villageName'],
    ['school.gps'],
    [],
  ];

  const mutation = useMutation({
    mutationFn: (values: SchoolFormValues) => registrationApi.submitSchool(buildSchoolPayload(values, authenticated)),
    onError: (error) => {
      rate.track(error);
      if (!isApiError(error)) return;
      applyApiFieldErrors(error, form.setError);
      const first = error.fieldErrors[0];
      const byField = first
        ? stepForField(first.field, [['applicant', 0], ['organizationId', 1], ['school.gps', 3], ['school', 2]])
        : undefined;
      const step = byField ?? (error.code ? SCHOOL_ERROR_STEP[error.code] : undefined);
      if (step !== undefined) wizard.goTo(step);
    },
  });

  const goNext = async () => {
    if (await trigger(stepFields[wizard.index])) wizard.next();
  };

  const selectOrganization = (selected: OrganizationOption) => {
    if (selected.id !== organizationId) {
      // Governorates belong to the organization: clear the dependent selection.
      setValue('school.governorateId', '');
    }
    setOrganization(selected);
    setValue('organizationId', selected.id, { shouldValidate: true });
  };

  if (mutation.isSuccess) {
    const { school } = mutation.data;
    return (
      <AuthPageLayout title={t('schoolPage.title')} wide>
        <SuccessPanel
          title={t('schoolPage.successTitle')}
          description={t('schoolPage.pendingExplain')}
          details={[
            { label: t('schoolPage.name'), value: school.name },
            { label: t('schoolPage.code'), value: <bdi dir="ltr">{school.code}</bdi> },
            { label: t('schoolPage.status'), value: t(`status.${school.status}`, { defaultValue: school.status }) },
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

  const values = watch();
  const governorateName = governorates.data?.find((g) => g.id === governorateId)?.name ?? '—';
  const dash = (v?: string) => (v && v.trim() ? v.trim() : '—');
  const gpsError = (errors.school?.gps as { message?: string } | undefined)?.message;

  return (
    <AuthPageLayout
      wide
      title={t('schoolPage.title')}
      subtitle={t('schoolPage.subtitle')}
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
            <OrganizationSelector
              selected={organization}
              onSelect={selectOrganization}
              error={errors.organizationId?.message}
            />
          )}

          {wizard.index === 2 && (
            <div className="stack">
              <OptionSelect
                label={t('school.governorate')}
                query={governorates}
                enabled={Boolean(organizationId)}
                disabledHint={t('school.selectOrganizationFirst')}
                error={errors.school?.governorateId?.message}
                registration={register('school.governorateId')}
              />
              <FormField label={t('school.name')} error={errors.school?.name?.message}>
                {(c) => <TextInput {...c} {...register('school.name')} />}
              </FormField>
              <FormField label={t('school.centerName')} optional error={errors.school?.centerName?.message}>
                {(c) => <TextInput {...c} {...register('school.centerName')} />}
              </FormField>
              <FormField label={t('school.villageName')} optional error={errors.school?.villageName?.message}>
                {(c) => <TextInput {...c} {...register('school.villageName')} />}
              </FormField>
            </div>
          )}

          {wizard.index === 3 && <GpsLocationCard state={gpsState} onCapture={capture} error={gpsError} />}

          {wizard.index === 4 && (
            <div className="stack">
              <Alert variant="info">{t('schoolPage.reviewNotice')}</Alert>
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
                    rows: [{ label: t('schoolOrg.organization'), value: organization?.name ?? '—' }],
                  },
                  {
                    title: t('steps.details'),
                    editLabel: t('review.edit'),
                    onEdit: () => wizard.goTo(2),
                    rows: [
                      { label: t('school.name'), value: dash(values.school.name) },
                      { label: t('school.governorate'), value: governorateName },
                      { label: t('school.centerName'), value: dash(values.school.centerName) },
                      { label: t('school.villageName'), value: dash(values.school.villageName) },
                    ],
                  },
                  {
                    title: t('steps.location'),
                    editLabel: t('review.edit'),
                    onEdit: () => wizard.goTo(3),
                    rows: gps
                      ? [
                          { label: t('gps.coordinates'), value: <bdi dir="ltr">{`${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`}</bdi> },
                          { label: t('gps.accuracyLabel'), value: t('gps.meters', { meters: formatNumber(gps.accuracyMeters, language, { maximumFractionDigits: 1 }) }) },
                        ]
                      : [{ label: t('gps.coordinates'), value: '—' }],
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
              <Button variant="primary" onClick={() => void goNext()} disabled={gpsState.status === 'requesting'}>
                {t('actions.next')}
              </Button>
            ) : (
              <Button type="submit" variant="primary" loading={mutation.isPending} disabled={rate.secondsLeft > 0 || !gps}>
                {t('schoolPage.submit')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </AuthPageLayout>
  );
}
