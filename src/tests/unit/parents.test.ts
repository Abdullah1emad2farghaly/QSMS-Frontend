import { beforeEach, describe, expect, it } from 'vitest';
import { navItemsFor } from '@/app/config/navigation';
import { editParentAddressSchema, registerParentSchema } from '@/schemas/parents';
import { ApiError } from '@/services/api';
import { buildEndpointRequest, ENDPOINTS } from '@/services/api/endpoints';
import type { AuthSessionData } from '@/types';
import { buildRegisterParentPayload } from '@/services/parents/parentsApi';
import { STORAGE_KEYS } from '@/app/config';
import { applySession, endSession } from '@/services/auth/authSession';
import { useAuthStore } from '@/store';
import i18n from '@/translation/i18n';
import { normalizeDigits } from '@/utils/digits';
import { getParentErrorMessage, PARENT_ERROR_FIELD } from '@/utils/parentErrors';
import { addressToRequestString } from '@/utils/parents';

const SCHOOL = '9a4e7c21-6d03-4b58-8e1f-0c2d5b7a3f64';
const PARENT = 'parent-uuid-1';

describe('parents endpoints (exact contract)', () => {
  it('builds every request with the documented method, path, query and body', () => {
    expect(buildEndpointRequest('listParents', { pathParams: { schoolId: SCHOOL }, query: { page: '2', pageSize: '20', sort: '-createdAt' } })).toMatchObject({
      method: 'GET',
      url: `/api/v1/parents/schools/${SCHOOL}`,
      params: { page: '2', pageSize: '20', sort: '-createdAt' },
      skipAuth: false,
    });
    expect(buildEndpointRequest('getParent', { pathParams: { id: PARENT } })).toMatchObject({ method: 'GET', url: `/api/v1/parents/${PARENT}` });
    expect(buildEndpointRequest('updateParentAddress', { pathParams: { id: PARENT }, body: { address: 'المنيا / مطاي' } })).toMatchObject({
      method: 'PATCH',
      url: `/api/v1/parents/${PARENT}`,
      data: { address: 'المنيا / مطاي' },
    });
    expect(
      buildEndpointRequest('listParentStudents', { pathParams: { parentId: PARENT }, query: { page: '1', pageSize: '10', sort: '-createdAt', 'filter[status]': 'ACTIVE' } }),
    ).toMatchObject({ method: 'GET', url: `/api/v1/students/parents/${PARENT}`, params: { 'filter[status]': 'ACTIVE' } });
    expect(buildEndpointRequest('endParentSchoolLink', { pathParams: { id: PARENT, schoolId: SCHOOL } })).toMatchObject({
      method: 'DELETE',
      url: `/api/v1/parents/${PARENT}/schools/${SCHOOL}`,
      data: undefined,
    });
  });

  it('requires the SCHOOL_MANAGER role and a bearer token on all six endpoints', () => {
    for (const id of ['listParents', 'registerParent', 'getParent', 'updateParentAddress', 'listParentStudents', 'endParentSchoolLink'] as const) {
      expect(ENDPOINTS[id].auth).toBe('required');
      expect(ENDPOINTS[id].authorization.roles).toEqual(['SCHOOL_MANAGER']);
    }
  });

  it('registers with a STRING address and never sends addressFields or a password', () => {
    const body = buildRegisterParentPayload(SCHOOL, { name: '  أحمد   محمد  علي ', phone: ' ٠١٠٠١٢٣٤٥٦٧ ', address: ' المنيا / سمالوط / برمشا ' }, normalizeDigits);
    expect(body).toEqual({ schoolId: SCHOOL, name: 'أحمد محمد علي', phone: '01001234567', address: 'المنيا / سمالوط / برمشا' });
    expect(Object.keys(body).sort()).toEqual(['address', 'name', 'phone', 'schoolId']);
    const request = buildEndpointRequest('registerParent', { body });
    expect(request).toMatchObject({ method: 'POST', url: '/api/v1/parents', data: body });
  });
});

describe('parent schemas', () => {
  it('requires exactly three name parts and limits', () => {
    const ok = { name: 'أحمد محمد علي', phone: '01001234567', address: 'المنيا / سمالوط' };
    expect(registerParentSchema.safeParse(ok).success).toBe(true);
    expect(registerParentSchema.safeParse({ ...ok, name: 'أحمد محمد' }).success).toBe(false);
    expect(registerParentSchema.safeParse({ ...ok, name: 'أحمد محمد علي حسن' }).success).toBe(false);
    expect(registerParentSchema.safeParse({ ...ok, phone: '1'.repeat(41) }).success).toBe(false);
    expect(registerParentSchema.safeParse({ ...ok, address: 'x'.repeat(601) }).success).toBe(false);
    expect(registerParentSchema.safeParse({ ...ok, address: '   ' }).success).toBe(false);
  });
  it('edit schema only knows the address (max 600)', () => {
    expect(editParentAddressSchema.safeParse({ address: 'المنيا / مطاي' }).success).toBe(true);
    expect(editParentAddressSchema.safeParse({ address: 'x'.repeat(601) }).success).toBe(false);
  });
  it('turns the address object into the request string, skipping missing parts', () => {
    const address = { governorateId: 'g', governorateName: 'المنيا', centerName: 'مطاي', villageName: null, since: '2026-10-18T09:30:00.000Z' };
    expect(addressToRequestString(address)).toBe('المنيا / مطاي');
  });
});

describe('parent error messages', () => {
  const codes = Object.keys(i18n.getResourceBundle('en', 'parents').errors as Record<string, string>);

  it('documents a localized message in Arabic and English for every parent code', async () => {
    const ar = Object.keys(i18n.getResourceBundle('ar', 'parents').errors as Record<string, string>);
    expect(ar.sort()).toEqual([...codes].sort());
    for (const code of [
      'INVALID_PARENT_NAME', 'PARENT_ADDRESS_REQUIRED', 'INVALID_PARENT_ADDRESS', 'PARENT_ADDRESS_GOVERNORATE_NOT_FOUND',
      'PARENT_ADDRESS_GOVERNORATE_INACTIVE', 'PARENT_ADDRESS_COUNTRY_MISMATCH', 'INVALID_PHONE_NUMBER', 'PARENT_IDENTITY_CONFLICT',
      'PARENT_ACCOUNT_INACTIVE', 'PARENT_ORGANIZATION_CONFLICT', 'PARENT_ALREADY_LINKED_TO_SCHOOL', 'VALIDATION_FAILED',
      'PARENT_UPDATE_EMPTY', 'PARENT_HAS_STUDENTS_IN_SCHOOL',
    ]) {
      expect(codes).toContain(code);
    }
    await i18n.changeLanguage('en');
    expect(getParentErrorMessage(new ApiError('business_rule', { status: 422, code: 'PARENT_HAS_STUDENTS_IN_SCHOOL', serverMessage: 'raw' }))).toMatch(/still has students/);
    await i18n.changeLanguage('ar');
    expect(getParentErrorMessage(new ApiError('business_rule', { status: 422, code: 'PARENT_HAS_STUDENTS_IN_SCHOOL' }))).toMatch(/طلاب/);
    await i18n.changeLanguage('en');
  });

  it('falls back to the server message for codes it does not own, never to technical text', () => {
    expect(getParentErrorMessage(new ApiError('conflict', { status: 409, code: 'SOMETHING_NEW', serverMessage: 'Localized by server' }))).toBe('Localized by server');
    expect(getParentErrorMessage(new Error('boom'))).not.toMatch(/boom/);
  });

  it('places field-level codes next to the right input', () => {
    expect(PARENT_ERROR_FIELD.INVALID_PARENT_NAME).toBe('name');
    expect(PARENT_ERROR_FIELD.INVALID_PHONE_NUMBER).toBe('phone');
    expect(PARENT_ERROR_FIELD.PARENT_ADDRESS_GOVERNORATE_NOT_FOUND).toBe('address');
    expect(PARENT_ERROR_FIELD.PARENT_IDENTITY_CONFLICT).toBeUndefined();
  });
});

describe('navigation and session schoolId', () => {
  const session = (extra: Record<string, unknown> = {}): AuthSessionData =>
    ({
      tokenType: 'Bearer', accessToken: 'access', accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
      refreshToken: 'refresh', refreshTokenExpiresAt: '2099-02-01T00:00:00.000Z',
      user: { id: 'u1', phone: '0100' }, mustChangePassword: false, roles: ['SCHOOL_MANAGER', 'TEACHER'], ...extra,
    }) as AuthSessionData;

  beforeEach(() => {
    endSession(null);
    window.localStorage.clear();
  });

  it('offers the Parents entry only to the active SCHOOL_MANAGER', () => {
    expect(navItemsFor('SCHOOL_MANAGER').map((i) => i.to)).toContain('/school-manager/parents');
    expect(navItemsFor('TEACHER').map((i) => i.to)).not.toContain('/school-manager/parents');
    expect(navItemsFor(null).map((i) => i.to)).not.toContain('/school-manager/parents');
  });

  it('login stores data.schoolId exactly, in memory and in the persisted session', () => {
    applySession(session({ activeRole: 'SCHOOL_MANAGER', schoolId: SCHOOL }));
    expect(useAuthStore.getState().schoolId).toBe(SCHOOL);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.session) ?? '{}').schoolId).toBe(SCHOOL);
  });

  it('null or missing schoolId is stored as null', () => {
    applySession(session({ schoolId: null }));
    expect(useAuthStore.getState().schoolId).toBeNull();
    applySession(session());
    expect(useAuthStore.getState().schoolId).toBeNull();
  });

  it('sign-out clears it', () => {
    applySession(session({ schoolId: SCHOOL }));
    endSession(null);
    expect(useAuthStore.getState().schoolId).toBeNull();
  });
});
