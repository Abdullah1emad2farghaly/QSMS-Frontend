import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface FieldControlProps {
  id: string;
  'aria-invalid': boolean | undefined;
  'aria-describedby': string | undefined;
  'aria-required': boolean | undefined;
}

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  /** Marks the field as optional in the label (required fields are the default). */
  optional?: boolean;
  required?: boolean;
  children: (control: FieldControlProps) => ReactNode;
}

/** Label + control + hint + error with the right aria wiring. The control is supplied by render prop. */
export function FormField({ label, error, hint, optional = false, required = true, children }: FormFieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
        {optional && <span className="field-optional">{t('form.optional')}</span>}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required && !optional ? true : undefined,
      })}
      {hint && (
        <span id={hintId} className="field-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
