import { z } from 'zod';
import i18n from '@/translation/i18n';
import { phoneField } from './auth';

const tv = (key: string) => i18n.t(key, { ns: 'validation' });

/** Documented limit: address ≤ 600 characters. Format ("Governorate / Center / Village") is validated by the server. */
export const addressField = z.string().trim().min(1).max(600);

/** Documented rule: at most 200 characters and exactly three name parts. */
export const parentNameField = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .superRefine((value, ctx) => {
    if (value.split(/\s+/).length !== 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: tv('parentNameThreeParts') });
    }
  });

export const registerParentSchema = z.object({
  name: parentNameField,
  phone: phoneField,
  address: addressField,
});
export type RegisterParentFormValues = z.infer<typeof registerParentSchema>;

export const editParentAddressSchema = z.object({ address: addressField });
export type EditParentAddressFormValues = z.infer<typeof editParentAddressSchema>;
