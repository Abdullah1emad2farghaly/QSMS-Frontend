import type { ApplicantInput, GpsReading, RegisterOrganizationRequest, SubmitSchoolRequest } from '@/types';
import { normalizeDigits } from '@/utils/digits';

/** Form-side shapes (strings straight from inputs). Mirrors the request so server field paths line up. */
export interface ApplicantFormValues {
  name: string;
  phone: string;
  password?: string;
}
export interface OrganizationFormValues {
  applicant: ApplicantFormValues;
  organization: {
    name: string;
    countryId: string;
    governorateId: string;
    centerName?: string;
    villageName?: string;
  };
}
export interface SchoolFormValues {
  applicant: ApplicantFormValues;
  organizationId: string;
  school: {
    name: string;
    governorateId: string;
    centerName?: string;
    villageName?: string;
    gps: GpsReading | null;
  };
}

const optional = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/** Password is sent only for anonymous applicants; an authenticated applicant never sends one. */
function buildApplicant(values: ApplicantFormValues, authenticated: boolean): ApplicantInput {
  const applicant: ApplicantInput = { name: values.name.trim(), phone: normalizeDigits(values.phone.trim()) };
  if (!authenticated && values.password) applicant.password = values.password;
  return applicant;
}

export function buildOrganizationPayload(
  values: OrganizationFormValues,
  authenticated: boolean,
): RegisterOrganizationRequest {
  const { organization } = values;
  const payload: RegisterOrganizationRequest = {
    applicant: buildApplicant(values.applicant, authenticated),
    organization: {
      name: organization.name.trim(),
      countryId: organization.countryId,
      governorateId: organization.governorateId,
    },
  };
  const centerName = optional(organization.centerName);
  const villageName = optional(organization.villageName);
  if (centerName) payload.organization.centerName = centerName;
  if (villageName) payload.organization.villageName = villageName;
  return payload;
}

/**
 * `school.countryId` is intentionally omitted: it is optional and the organization determines the
 * school's country (the public lookup does not expose the organization's country anyway).
 */
export function buildSchoolPayload(values: SchoolFormValues, authenticated: boolean): SubmitSchoolRequest {
  const { school } = values;
  if (!school.gps) throw new Error('GPS reading is required');
  const payload: SubmitSchoolRequest = {
    applicant: buildApplicant(values.applicant, authenticated),
    organizationId: values.organizationId,
    school: {
      name: school.name.trim(),
      governorateId: school.governorateId,
      gps: {
        latitude: school.gps.latitude,
        longitude: school.gps.longitude,
        accuracyMeters: school.gps.accuracyMeters,
      },
    },
  };
  const centerName = optional(school.centerName);
  const villageName = optional(school.villageName);
  if (centerName) payload.school.centerName = centerName;
  if (villageName) payload.school.villageName = villageName;
  return payload;
}
