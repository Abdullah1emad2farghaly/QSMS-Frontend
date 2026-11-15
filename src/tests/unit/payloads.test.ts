import { describe, expect, it } from 'vitest';
import {
  buildOrganizationPayload,
  buildSchoolPayload,
  type OrganizationFormValues,
  type SchoolFormValues,
} from '@/services/registration/payloads';

const org: OrganizationFormValues = {
  applicant: { name: ' Ali ', phone: '٠١٠١٢٣٤٥٦٧٨', password: '123456' },
  organization: { name: ' Org ', countryId: 'c1', governorateId: 'g1', centerName: '  ', villageName: 'V' },
};
const school: SchoolFormValues = {
  applicant: { name: 'Ali', phone: '0101', password: '123456' },
  organizationId: 'o1',
  school: {
    name: 'School',
    governorateId: 'g1',
    centerName: '',
    villageName: '',
    gps: { latitude: 30.04, longitude: 31.23, accuracyMeters: 12 },
  },
};

describe('buildOrganizationPayload', () => {
  it('sends the password for anonymous applicants and normalizes phone digits and text', () => {
    expect(buildOrganizationPayload(org, false)).toEqual({
      applicant: { name: 'Ali', phone: '01012345678', password: '123456' },
      organization: { name: 'Org', countryId: 'c1', governorateId: 'g1', villageName: 'V' },
    });
  });

  it('never sends a password for authenticated applicants', () => {
    expect(buildOrganizationPayload(org, true).applicant).toEqual({ name: 'Ali', phone: '01012345678' });
  });
});

describe('buildSchoolPayload', () => {
  it('omits optional empty fields and school.countryId (the organization decides the country)', () => {
    const payload = buildSchoolPayload(school, false);
    expect(payload).toEqual({
      applicant: { name: 'Ali', phone: '0101', password: '123456' },
      organizationId: 'o1',
      school: { name: 'School', governorateId: 'g1', gps: { latitude: 30.04, longitude: 31.23, accuracyMeters: 12 } },
    });
    expect('countryId' in payload.school).toBe(false);
  });

  it('omits the password when authenticated', () => {
    expect(buildSchoolPayload(school, true).applicant.password).toBeUndefined();
  });

  it('refuses to build without a GPS reading (no fake coordinates)', () => {
    expect(() => buildSchoolPayload({ ...school, school: { ...school.school, gps: null } }, false)).toThrow();
  });
});
