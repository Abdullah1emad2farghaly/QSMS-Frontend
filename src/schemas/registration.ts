import { z } from 'zod';
import { GPS_MAX_ACCURACY_METERS } from '@/app/config';
import i18n from '@/translation/i18n';
import { newPasswordField, phoneField } from './auth';

const tv = (key: string) => i18n.t(key, { ns: 'validation' });

const name200 = z.string().trim().min(1).max(200);
const optional200 = z.string().trim().max(200).optional();
const id = z.string().min(1);

/** Applicant: password only for anonymous applicants (authenticated ones never send it). */
const passwordSchema = (required: boolean): z.ZodType<string | undefined> =>
  required ? newPasswordField : z.string().optional();

const applicantSchema = (requirePassword: boolean) =>
  z.object({
    name: name200,
    phone: phoneField,
    password: passwordSchema(requirePassword),
  });

export const organizationSchema = (requirePassword: boolean) =>
  z.object({
    applicant: applicantSchema(requirePassword),
    organization: z.object({
      name: name200,
      countryId: id,
      governorateId: id,
      centerName: optional200,
      villageName: optional200,
    }),
  });

const gpsSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracyMeters: z.number().min(0),
  })
  .nullable()
  .superRefine((gps, ctx) => {
    if (!gps) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: tv('gpsRequired') });
    } else if (gps.accuracyMeters > GPS_MAX_ACCURACY_METERS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: tv('gpsAccuracy') });
    }
  });

export const schoolSchema = (requirePassword: boolean) =>
  z.object({
    applicant: applicantSchema(requirePassword),
    organizationId: id,
    school: z.object({
      name: name200,
      governorateId: id,
      centerName: optional200,
      villageName: optional200,
      gps: gpsSchema,
    }),
  });
