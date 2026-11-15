import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldValues, type UseFormProps, type UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

/**
 * react-hook-form + Zod integration point for future forms. Pass a schema whose input and
 * output types are the same. Server-side field errors: `applyApiFieldErrors(error, form.setError)`.
 */
export function useZodForm<T extends FieldValues>(
  schema: z.ZodType<T, z.ZodTypeDef, T>,
  options: Omit<UseFormProps<T>, 'resolver'> = {},
): UseFormReturn<T> {
  return useForm<T>({ mode: 'onTouched', ...options, resolver: zodResolver(schema) });
}
