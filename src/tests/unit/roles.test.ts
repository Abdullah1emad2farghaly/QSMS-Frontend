import { describe, expect, it } from 'vitest';
import { resolvePostLoginPath } from '@/app/routes/postLogin';
import { getAvailableRoles, needsRoleSelection, resolveActiveRole } from '@/utils/roles';

describe('role helpers', () => {
  it('only offers assigned roles that have a landing destination, without duplicates', () => {
    expect(getAvailableRoles(['TEACHER', 'STUDENT', 'PARENT', 'TEACHER', 'VILLAGE_MANAGER'])).toEqual(['TEACHER', 'PARENT']);
    expect(getAvailableRoles([])).toEqual([]);
  });

  it('single role: that role is used', () => {
    expect(resolveActiveRole(['TEACHER'], null)).toBe('TEACHER');
    expect(resolveActiveRole(['TEACHER'], 'TEACHER')).toBe('TEACHER');
    expect(needsRoleSelection(['TEACHER'], null)).toBe(false);
  });

  it('multiple roles: the backend activeRole is used when it is assigned', () => {
    expect(resolveActiveRole(['TEACHER', 'PARENT'], 'PARENT')).toBe('PARENT');
    expect(needsRoleSelection(['TEACHER', 'PARENT'], 'PARENT')).toBe(false);
  });

  it('multiple roles and no active role: selection is required and no role is active', () => {
    expect(resolveActiveRole(['TEACHER', 'PARENT'], null)).toBeNull();
    expect(resolveActiveRole(['TEACHER', 'PARENT'], undefined)).toBeNull();
    expect(needsRoleSelection(['TEACHER', 'PARENT'], null)).toBe(true);
  });

  it('never trusts an active role that is not assigned to the user', () => {
    expect(resolveActiveRole(['TEACHER', 'PARENT'], 'MAIN_ADMIN')).toBeNull();
    expect(resolveActiveRole(['TEACHER'], 'MAIN_ADMIN')).toBe('TEACHER');
  });

  it('no role with a destination: nothing is active and no selection is offered', () => {
    expect(resolveActiveRole(['STUDENT'], null)).toBeNull();
    expect(needsRoleSelection(['STUDENT'], null)).toBe(false);
  });
});

describe('resolvePostLoginPath', () => {
  const auth = (roles: never[], activeRole: never | null = null, mustChangePassword = false) => ({ roles, activeRole, mustChangePassword });

  it.each([
    ['MAIN_ADMIN', '/main-admin'],
    ['ORGANIZATION_MANAGER', '/organization-manager'],
    ['SCHOOL_MANAGER', '/school-manager'],
    ['TEACHER', '/teacher'],
    ['PARENT', '/parent'],
  ])('%s opens %s', (role, path) => {
    expect(resolvePostLoginPath(null, auth([role] as never, role as never))).toBe(path);
  });

  it('forced password change first, then role selection, then the earlier location, then the role page', () => {
    expect(resolvePostLoginPath(null, auth(['TEACHER', 'PARENT'] as never, null, true))).toBe('/change-password');
    expect(resolvePostLoginPath({ from: { pathname: '/my-devices' } }, auth(['TEACHER', 'PARENT'] as never))).toBe('/select-role');
    expect(resolvePostLoginPath({ from: { pathname: '/my-devices' } }, auth(['TEACHER'] as never, 'TEACHER' as never))).toBe('/my-devices');
    expect(resolvePostLoginPath(null, auth([]))).toBe('/my-devices');
  });

  it('ignores a "from" that is an auth screen', () => {
    expect(resolvePostLoginPath({ from: { pathname: '/select-role' } }, auth(['TEACHER'] as never, 'TEACHER' as never))).toBe('/teacher');
  });
});
