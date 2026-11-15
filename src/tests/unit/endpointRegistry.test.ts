import { describe, expect, it } from 'vitest';
import { buildEndpointRequest, ENDPOINTS } from '@/services/api/endpoints';

const EXPECTED: Record<string, [string, string]> = {
  login: ['POST', '/api/v1/auth/login'],
  refreshTokens: ['POST', '/api/v1/auth/refresh'],
  switchRole: ['POST', '/api/v1/auth/switch-role'],
  logout: ['POST', '/api/v1/auth/logout'],
  logoutAll: ['POST', '/api/v1/auth/logout-all'],
  changePassword: ['POST', '/api/v1/auth/change-password'],
  listMyDevices: ['GET', '/api/v1/auth/sessions'],
  revokeMyDevice: ['DELETE', '/api/v1/auth/sessions/{sessionId}'],
  requestPasswordRecovery: ['POST', '/api/v1/auth/password-recovery/request'],
  verifyPasswordRecoveryOtp: ['POST', '/api/v1/auth/password-recovery/verify'],
  resetPassword: ['POST', '/api/v1/auth/password-recovery/reset'],
  getCountries: ['GET', '/api/v1/geography/countries'],
  getGovernorates: ['GET', '/api/v1/geography/governorates'],
  getOrganizations: ['GET', '/api/v1/organizations/lookup'],
  registerOrganization: ['POST', '/api/v1/organizations'],
  submitSchool: ['POST', '/api/v1/schools/submissions'],
};

describe('endpoint registry', () => {
  it('documents exactly the 15 original endpoints plus switch-role, with the exact methods and paths', () => {
    expect(Object.keys(ENDPOINTS).sort()).toEqual(Object.keys(EXPECTED).sort());
    for (const [id, [method, path]] of Object.entries(EXPECTED)) {
      const def = ENDPOINTS[id as keyof typeof ENDPOINTS];
      expect(def.operationId).toBe(id);
      expect([def.method, def.path]).toEqual([method, path]);
    }
  });

  it('flags switch-role as an unverified contract (no backend documentation was available)', () => {
    expect(ENDPOINTS.switchRole.unverified).toBe(true);
    expect(Object.values(ENDPOINTS).filter((e) => e.unverified)).toHaveLength(1);
    expect(ENDPOINTS.switchRole.auth).toBe('required');
  });

  it('keeps authorization metadata', () => {
    expect(ENDPOINTS.login.auth).toBe('none');
    expect(ENDPOINTS.logout.auth).toBe('required');
    expect(ENDPOINTS.registerOrganization.auth).toBe('optional');
    expect(ENDPOINTS.registerOrganization.authorization.decisionStatus).toBe('APPROVED');
    expect(ENDPOINTS.submitSchool.authorization.decisionStatus).toBe('PROVISIONAL');
    expect(ENDPOINTS.login.successStatus).toBe(200);
    expect(ENDPOINTS.logout.successStatus).toBe(204);
    expect(ENDPOINTS.submitSchool.successStatus).toBe(201);
    expect(ENDPOINTS.login.noStore).toBe(true);
    expect(ENDPOINTS.logout.noStore).toBe(false);
  });

  it('builds request configs: path params encoded, public endpoints skip auth', () => {
    const revoke = buildEndpointRequest('revokeMyDevice', { pathParams: { sessionId: 'a/b' } });
    expect(revoke).toMatchObject({ method: 'DELETE', url: '/api/v1/auth/sessions/a%2Fb', skipAuth: false });

    const login = buildEndpointRequest('login', { body: { phone: '1', password: 'p' } });
    expect(login).toMatchObject({ method: 'POST', url: '/api/v1/auth/login', skipAuth: true });

    const orgs = buildEndpointRequest('getOrganizations', { query: { page: '2' } });
    expect(orgs).toMatchObject({ params: { page: '2' } });
  });
});
