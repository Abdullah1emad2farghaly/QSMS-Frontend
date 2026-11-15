import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiError } from '@/services/api';

/**
 * Maps backend field errors (`error.details.fields[]`) onto a react-hook-form instance.
 * Only the first message per field is applied. Field names are used as sent by the backend.
 */
export function applyApiFieldErrors<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
): void {
  const seen = new Set<string>();
  for (const fieldError of error.fieldErrors) {
    if (seen.has(fieldError.field)) continue;
    seen.add(fieldError.field);
    setError(fieldError.field as Path<T>, { type: fieldError.code, message: fieldError.message });
  }
}
