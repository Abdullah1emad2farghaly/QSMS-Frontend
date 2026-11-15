import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAccessDecider } from '@/app/guards/accessControl';
import { protectedRoutes } from '@/app/routes/routes';
import { RoleSwitcher } from '@/components/auth/RoleSwitcher';
import RoleLandingPage from '@/pages/roles/RoleLandingPage';
import SelectRolePage from '@/pages/auth/SelectRolePage';
import { ApiError } from '@/services/api';
import { authAccessDecider } from '@/services/auth/registerAuth';
import { createQueryClient } from '@/services/query';
import { useAuthStore } from '@/store';
import i18n from '@/translation/i18n';
import { renderWithProviders } from '../utils/renderWithProviders';

vi.mock('@/services/auth/authActions', () => ({ switchRole: vi.fn(), logout: vi.fn(), logoutAll: vi.fn(), changePassword: vi.fn(), login: vi.fn(), revokeSession: vi.fn() }));
vi.mock('@/services/auth/authApi', () => ({ authApi: { listSessions: vi.fn() } }));
import { switchRole } from '@/services/auth/authActions';

type Role = 'MAIN_ADMIN' | 'ORGANIZATION_MANAGER' | 'SCHOOL_MANAGER' | 'TEACHER' | 'PARENT' | 'STUDENT';
const signIn = (roles: Role[], activeRole: Role | null, extra: Record<string, unknown> = {}) =>
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 't',
    user: { id: 'u1', phone: '0100' },
    roles: roles as never,
    activeRole: activeRole as never,
    mustChangePassword: false,
    ...extra,
  });

const NAMES = {
  MAIN_ADMIN: { en: 'Main Admin', ar: 'المدير الرئيسي', path: '/main-admin' },
  ORGANIZATION_MANAGER: { en: 'Organization Manager', ar: 'مدير المؤسسة', path: '/organization-manager' },
  SCHOOL_MANAGER: { en: 'School Manager', ar: 'مدير المدرسة', path: '/school-manager' },
  TEACHER: { en: 'Teacher', ar: 'المعلم', path: '/teacher' },
  PARENT: { en: 'Parent', ar: 'ولي الأمر', path: '/parent' },
} as const;

beforeEach(async () => {
  vi.mocked(switchRole).mockReset();
  useAuthStore.getState().clear();
  await act(() => i18n.changeLanguage('en'));
});
afterEach(() => setAccessDecider(null));

describe('RoleSwitcher', () => {
  it('lists only the roles the backend assigned (unsupported roles are not shown)', () => {
    signIn(['TEACHER', 'PARENT', 'STUDENT'], 'TEACHER');
    renderWithProviders(<RoleSwitcher />);
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Teacher', 'Parent']);
  });

  it('does not call the API when the already-active role is chosen', () => {
    signIn(['TEACHER', 'PARENT'], 'TEACHER');
    renderWithProviders(<RoleSwitcher />);
    fireEvent.change(screen.getByTestId('role-switcher'), { target: { value: 'TEACHER' } });
    expect(switchRole).not.toHaveBeenCalled();
  });

  it('switches immediately (no confirmation dialog) when another role is chosen', async () => {
    signIn(['TEACHER', 'PARENT'], 'TEACHER');
    vi.mocked(switchRole).mockResolvedValue('PARENT');
    renderWithProviders(<RoleSwitcher />);
    fireEvent.change(screen.getByTestId('role-switcher'), { target: { value: 'PARENT' } });
    await waitFor(() => expect(switchRole).toHaveBeenCalledWith('PARENT'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows a localized error and keeps the control usable when switching fails', async () => {
    signIn(['TEACHER', 'PARENT'], 'TEACHER');
    vi.mocked(switchRole).mockRejectedValue(new ApiError('forbidden', { status: 403 }));
    renderWithProviders(<RoleSwitcher />);
    fireEvent.change(screen.getByTestId('role-switcher'), { target: { value: 'PARENT' } });
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByTestId('role-switcher')).not.toBeDisabled();
  });

  it('single-role accounts see their role name, not a switcher', () => {
    signIn(['TEACHER'], 'TEACHER');
    renderWithProviders(<RoleSwitcher />);
    expect(screen.queryByTestId('role-switcher')).not.toBeInTheDocument();
    expect(screen.getByText('Teacher')).toBeInTheDocument();
  });

  it('renders nothing when no role has a destination', () => {
    signIn(['STUDENT'], null);
    const { container } = renderWithProviders(<RoleSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });
});

const renderSelect = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/select-role']}>
        <Routes>
          <Route path="/select-role" element={<SelectRolePage />} />
          <Route path="/teacher" element={<p>teacher landing</p>} />
          <Route path="/parent" element={<p>parent landing</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('SelectRolePage', () => {
  it('multi-role without an active role: shows only assigned roles and opens the chosen role landing page', async () => {
    signIn(['TEACHER', 'PARENT', 'STUDENT'], null);
    vi.mocked(switchRole).mockResolvedValue('PARENT');
    renderSelect();
    expect(screen.getByRole('heading', { name: 'Choose your role' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Teacher|Parent/ })).toHaveLength(2);
    expect(screen.queryByText('Student')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Parent' }));
    await waitFor(() => expect(switchRole).toHaveBeenCalledWith('PARENT'));
    expect(await screen.findByText('parent landing')).toBeInTheDocument();
  });

  it('does not ask again when a role is already active', () => {
    signIn(['TEACHER', 'PARENT'], 'PARENT');
    renderSelect();
    expect(screen.getByText('parent landing')).toBeInTheDocument();
  });

  it('single-role accounts skip selection', () => {
    signIn(['TEACHER'], null);
    renderSelect();
    expect(screen.getByText('teacher landing')).toBeInTheDocument();
  });

  it('shows an honest empty state when the account has no role with a web interface', () => {
    signIn(['STUDENT'], null);
    renderSelect();
    expect(screen.getByText('No role is available yet')).toBeInTheDocument();
  });

  it('shows the error and stays on the screen when activation fails', async () => {
    signIn(['TEACHER', 'PARENT'], null);
    vi.mocked(switchRole).mockRejectedValue(new ApiError('server', { status: 500 }));
    renderSelect();
    fireEvent.click(screen.getByRole('button', { name: 'Teacher' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Choose your role' })).toBeInTheDocument();
  });
});

describe('temporary landing pages', () => {
  it.each(Object.entries(NAMES))('%s: shows the activated role in English and Arabic, honestly and without fake data', async (role, names) => {
    signIn([role as Role], role as Role);
    const { unmount } = renderWithProviders(<RoleLandingPage />);
    expect(screen.getByText(`Role activated successfully: ${names.en}`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`The ${names.en} interface is being prepared`))).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome to the Quran Schools Management System');
    // No dashboard simulation: no tables, no buttons that do nothing.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    unmount();

    await act(() => i18n.changeLanguage('ar'));
    renderWithProviders(<RoleLandingPage />);
    expect(screen.getByText(`تم تفعيل الدور بنجاح: ${names.ar}`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`واجهة ${names.ar} قيد التجهيز`))).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('مرحبًا بك في نظام إدارة مدارس القرآن الكريم');
  });

  it('multi-role users get access to the role switcher on the page', () => {
    signIn(['TEACHER', 'PARENT'], 'TEACHER');
    renderWithProviders(<RoleLandingPage />);
    expect(screen.getByTestId('role-switcher')).toBeInTheDocument();
  });
});

function renderRoutes(path: string) {
  const router = createMemoryRouter(
    [
      ...protectedRoutes,
      { path: '/login', element: <p>login screen</p> },
      { path: '/', element: <p>public home</p> },
    ],
    { initialEntries: [path] },
  );
  render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe('role route protection (real routes and real access decider)', () => {
  beforeEach(() => setAccessDecider(authAccessDecider));

  it.each(Object.entries(NAMES))('%s opens %s only as the active role', async (role, names) => {
    signIn([role as Role], role as Role);
    renderRoutes(names.path);
    expect(await screen.findByTestId('role-landing')).toHaveAttribute('data-role', role);
  });

  it('a user active as Teacher who opens the Parent page is sent to the Teacher page', async () => {
    signIn(['TEACHER', 'PARENT'], 'TEACHER');
    const router = renderRoutes('/parent');
    await waitFor(() => expect(router.state.location.pathname).toBe('/teacher'));
    expect(await screen.findByTestId('role-landing')).toHaveAttribute('data-role', 'TEACHER');
  });

  it('a role that is not assigned never opens its page', async () => {
    signIn(['TEACHER'], 'TEACHER');
    const router = renderRoutes('/main-admin');
    await waitFor(() => expect(router.state.location.pathname).toBe('/teacher'));
  });

  it('multi-role without an active role cannot open a role page: role selection comes first', async () => {
    signIn(['TEACHER', 'PARENT'], null);
    const router = renderRoutes('/teacher');
    await waitFor(() => expect(router.state.location.pathname).toBe('/select-role'));
    expect(await screen.findByRole('heading', { name: 'Choose your role' })).toBeInTheDocument();
  });

  it('anonymous visitors are sent to sign-in', async () => {
    const router = renderRoutes('/teacher');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('a forced password change confines the user even on role pages', async () => {
    signIn(['TEACHER'], 'TEACHER', { mustChangePassword: true });
    const router = renderRoutes('/teacher');
    await waitFor(() => expect(router.state.location.pathname).toBe('/change-password'));
  });

  it('switching role (store update after a successful switch) moves the user to the new role page', async () => {
    signIn(['TEACHER', 'PARENT'], 'TEACHER');
    const router = renderRoutes('/teacher');
    await screen.findByTestId('role-landing');
    act(() => useAuthStore.getState().setActiveRole('PARENT'));
    await waitFor(() => expect(router.state.location.pathname).toBe('/parent'));
  });
});
