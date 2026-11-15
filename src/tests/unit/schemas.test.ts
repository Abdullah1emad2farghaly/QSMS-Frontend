import { describe, expect, it } from 'vitest';
import { changePasswordSchema, resetPasswordSchema } from '@/schemas/auth';
import { organizationSchema, schoolSchema } from '@/schemas/registration';

const base = { currentPassword: 'oldpass', newPassword: 'newpass', confirmPassword: 'newpass' };

describe('password schemas', () => {
  it('accepts a valid change', () => {
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
  });
  it.each([
    ['too short', { ...base, newPassword: 'abc', confirmPassword: 'abc' }],
    ['too long', { ...base, newPassword: '1234567890123', confirmPassword: '1234567890123' }],
    ['mismatch', { ...base, confirmPassword: 'other' }],
    ['same as current', { ...base, newPassword: 'oldpass', confirmPassword: 'oldpass' }],
  ])('rejects %s', (_name, value) => {
    expect(changePasswordSchema.safeParse(value).success).toBe(false);
  });
  it('reset: 4–12 characters and matching confirmation', () => {
    expect(resetPasswordSchema.safeParse({ newPassword: '1234', confirmPassword: '1234' }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ newPassword: '123', confirmPassword: '123' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ newPassword: '1234', confirmPassword: '12345' }).success).toBe(false);
  });
});

const orgValues = (password?: string) => ({
  applicant: { name: 'A', phone: '0101', password },
  organization: { name: 'O', countryId: 'c', governorateId: 'g' },
});

describe('registration schemas', () => {
  it('organization: password required only for anonymous applicants', () => {
    expect(organizationSchema(true).safeParse(orgValues(undefined)).success).toBe(false);
    expect(organizationSchema(true).safeParse(orgValues('1234')).success).toBe(true);
    expect(organizationSchema(false).safeParse(orgValues(undefined)).success).toBe(true);
  });

  const schoolValues = (gps: unknown) => ({
    applicant: { name: 'A', phone: '0101', password: '1234' },
    organizationId: 'o',
    school: { name: 'S', governorateId: 'g', gps },
  });
  it('school: GPS is mandatory and must be 20 m or better', () => {
    expect(schoolSchema(true).safeParse(schoolValues(null)).success).toBe(false);
    expect(schoolSchema(true).safeParse(schoolValues({ latitude: 1, longitude: 1, accuracyMeters: 21 })).success).toBe(false);
    expect(schoolSchema(true).safeParse(schoolValues({ latitude: 1, longitude: 1, accuracyMeters: 20 })).success).toBe(true);
  });
});
