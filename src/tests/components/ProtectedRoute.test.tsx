import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setAccessDecider } from '@/app/guards/accessControl';
import { GuestRoute } from '@/app/guards/GuestRoute';
import { ProtectedRoute } from '@/app/guards/ProtectedRoute';
import { useAuthStore } from '@/store';

const user = { id: 'u1', phone: '0100' };
const signIn = (extra: Partial<ReturnType<typeof useAuthStore.getState>> = {}) =>
  useAuthStore.setState({ status: 'authenticated', accessToken: 't', user, roles: [], mustChangePassword: false, ...extra });

const renderGuard = (access?: Parameters<typeof ProtectedRoute>[0]['access'], path = '/private') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/login" element={<p>login screen</p>} />
        <Route path="/change-password" element={<p>change password screen</p>} />
        <Route element={<ProtectedRoute access={access} redirectTo="/login" forbiddenRedirectTo="/" />}>
          <Route path="/private" element={<p>secret</p>} />
        </Route>
        <Route path="/my-devices" element={<p>devices</p>} />
        <Route element={<GuestRoute />}>
          <Route path="/guest" element={<p>guest page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => setAccessDecider(() => true));
afterEach(() => {
  setAccessDecider(null);
  useAuthStore.getState().clear();
});

describe('ProtectedRoute', () => {
  it('sends anonymous users to sign-in', () => {
    useAuthStore.getState().clear();
    renderGuard();
    expect(screen.getByText('login screen')).toBeInTheDocument();
  });

  it('shows a loading state while a stored session is being restored', () => {
    useAuthStore.setState({ status: 'restoring' });
    renderGuard();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('login screen')).not.toBeInTheDocument();
  });

  it('lets signed-in users through when the decider allows', () => {
    signIn();
    renderGuard();
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('denies a signed-in user whose roles do not match (role-aware)', () => {
    setAccessDecider((access) => access.roles?.some((r) => useAuthStore.getState().roles.includes(r)) === true);
    signIn({ roles: ['PARENT'] });
    renderGuard({ roles: ['TEACHER'] });
    expect(screen.getByText('home')).toBeInTheDocument();
  });

  it('allows a matching role', () => {
    setAccessDecider((access) => access.roles?.some((r) => useAuthStore.getState().roles.includes(r)) === true);
    signIn({ roles: ['TEACHER'] });
    renderGuard({ roles: ['TEACHER'] });
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('confines users with a forced password change to the change-password screen', () => {
    signIn({ mustChangePassword: true });
    renderGuard();
    expect(screen.getByText('change password screen')).toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  it('shows guest pages to anonymous users and redirects signed-in users', () => {
    useAuthStore.getState().clear();
    const { unmount } = renderGuard(undefined, '/guest');
    expect(screen.getByText('guest page')).toBeInTheDocument();
    unmount();
    signIn();
    renderGuard(undefined, '/guest');
    expect(screen.queryByText('guest page')).not.toBeInTheDocument();
  });
});
