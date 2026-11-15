import { useTranslation } from 'react-i18next';
import type { FieldErrors, FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { FormField, PasswordInput, PhoneInput, TextInput } from '@/components/ui';

interface ApplicantFieldsProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  /** Signed-in applicants keep their account: no password, phone locked to the account's. */
  authenticated: boolean;
}

type ApplicantErrors = { name?: { message?: string }; phone?: { message?: string }; password?: { message?: string } };

/** Applicant step shared by organization registration and school submission. */
export function ApplicantFields<T extends FieldValues>({ form, authenticated }: ApplicantFieldsProps<T>) {
  const { t } = useTranslation('registration');
  const field = (name: 'name' | 'phone' | 'password') => `applicant.${name}` as Path<T>;
  const errors = (form.formState.errors as FieldErrors<FieldValues>).applicant as ApplicantErrors | undefined;

  return (
    <div className="stack">
      {authenticated && <p className="muted">{t('applicant.authenticatedNote')}</p>}
      <FormField label={t('applicant.name')} error={errors?.name?.message}>
        {(c) => <TextInput {...c} autoComplete="name" {...form.register(field('name'))} />}
      </FormField>
      <FormField
        label={t('applicant.phone')}
        hint={authenticated ? t('applicant.phoneLocked') : undefined}
        error={errors?.phone?.message}
      >
        {(c) => <PhoneInput {...c} readOnly={authenticated} {...form.register(field('phone'))} />}
      </FormField>
      {!authenticated && (
        <FormField label={t('applicant.password')} hint={t('applicant.passwordHint')} error={errors?.password?.message}>
          {(c) => <PasswordInput {...c} autoComplete="new-password" {...form.register(field('password'))} />}
        </FormField>
      )}
    </div>
  );
}
