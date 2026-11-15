import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ParentDetailsPage from '@/pages/school_managers/ParentDetailsPage';
import ParentsPage from '@/pages/school_managers/ParentsPage';
import { ApiError } from '@/services/api';
import { createQueryClient } from '@/services/query';
import { useAuthStore } from '@/store';
import i18n from '@/translation/i18n';

vi.mock('@/services/parents/parentsApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/parents/parentsApi')>();
  return { ...original, parentsApi: { list: vi.fn(), register: vi.fn(), get: vi.fn(), updateAddress: vi.fn(), listStudents: vi.fn(), endSchoolLink: vi.fn() } };
});
import { parentsApi } from '@/services/parents/parentsApi';

const SCHOOL = '9a4e7c21-6d03-4b58-8e1f-0c2d5b7a3f64';
const address = { governorateId: 'g1', governorateName: 'المنيا', centerName: 'سمالوط', villageName: 'برمشا', since: '2026-10-18T09:30:00.000Z' };
const parent = {
  id: 'p1', userId: 'u1', organizationId: 'o1', name: 'أحمد محمد علي', phone: '+201001234567', address,
  schoolIds: [SCHOOL], createdAt: '2026-10-18T09:30:00.000Z', updatedAt: '2026-10-18T09:30:00.000Z',
};
const student = {
  id: 's1', schoolId: SCHOOL, organizationId: 'o1', parentId: 'p1', fullName: 'عمر أحمد محمد', nationalId: '30001010123456',
  joinDate: '2026-10-18', status: 'ACTIVE' as const, address, createdAt: '2026-10-18T09:30:00.000Z', updatedAt: '2026-10-18T09:30:00.000Z',
};
const page = (data: unknown[], meta: { page: number; pageSize: number; total: number; totalPages: number }) => ({ success: true as const, data, meta });

const renderAt = (route: string) =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/school-manager/parents" element={<ParentsPage />} />
          <Route path="/school-manager/parents/:parentId" element={<ParentDetailsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(async () => {
  for (const fn of Object.values(parentsApi)) vi.mocked(fn).mockReset();
  useAuthStore.setState({ schoolId: SCHOOL });
  await act(() => i18n.changeLanguage('en'));
});

describe('ParentsPage', () => {
  it('lists parents with pagination taken from meta (not from the array length)', async () => {
    vi.mocked(parentsApi.list).mockResolvedValue(page([parent], { page: 1, pageSize: 20, total: 41, totalPages: 3 }) as never);
    renderAt('/school-manager/parents');
    expect(await screen.findByText('أحمد محمد علي')).toBeInTheDocument();
    expect(screen.getByText('+201001234567')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(parentsApi.list).toHaveBeenCalledWith(SCHOOL, { page: '1', pageSize: '20', sort: '-createdAt' }, expect.anything());
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    await waitFor(() => expect(parentsApi.list).toHaveBeenCalledWith(SCHOOL, { page: '2', pageSize: '20', sort: '-createdAt' }, expect.anything()));
  });

  it('shows the empty state with an add action', async () => {
    vi.mocked(parentsApi.list).mockResolvedValue(page([], { page: 1, pageSize: 20, total: 0, totalPages: 0 }) as never);
    renderAt('/school-manager/parents');
    expect(await screen.findByText('No parents are linked to your school yet')).toBeInTheDocument();
  });

  it('shows a retryable error', async () => {
    vi.mocked(parentsApi.list).mockRejectedValue(new ApiError('network'));
    renderAt('/school-manager/parents');
    expect(await screen.findByText('Parents could not be loaded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('does not guess a school: without one it loads nothing and disables adding', () => {
    useAuthStore.setState({ schoolId: null });
    renderAt('/school-manager/parents');
    expect(screen.getByText('No school is assigned to this session')).toBeInTheDocument();
    expect(parentsApi.list).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Add parent/ })).toBeDisabled();
  });

  it('validates the name before calling the API, then registers with the string address', async () => {
    vi.mocked(parentsApi.list).mockResolvedValue(page([parent], { page: 1, pageSize: 20, total: 1, totalPages: 1 }) as never);
    vi.mocked(parentsApi.register).mockResolvedValue({ parent, link: {} as never, accountCreated: true });
    renderAt('/school-manager/parents');
    await screen.findByText('أحمد محمد علي');
    fireEvent.click(screen.getByRole('button', { name: /Add parent/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Full name/), { target: { value: 'أحمد محمد' } });
    fireEvent.change(within(dialog).getByLabelText(/Phone number/), { target: { value: '01001234567' } });
    fireEvent.change(within(dialog).getByLabelText(/Address/), { target: { value: 'المنيا / سمالوط / برمشا' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Register parent' }));
    expect(await within(dialog).findByText('Enter exactly three names')).toBeInTheDocument();
    expect(parentsApi.register).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText(/Full name/), { target: { value: 'أحمد محمد علي' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Register parent' }));
    await waitFor(() => expect(parentsApi.register).toHaveBeenCalled());
    expect(vi.mocked(parentsApi.register).mock.calls[0]![0]).toEqual({ schoolId: SCHOOL, name: 'أحمد محمد علي', phone: '01001234567', address: 'المنيا / سمالوط / برمشا' });
    expect(await screen.findByText(/must change the initial password/)).toBeInTheDocument();
    expect(screen.queryByText(/\b4567\b/)).not.toBeInTheDocument();
  });
});

describe('ParentDetailsPage', () => {
  it('is unavailable and requests nothing while no school is reported', () => {
    useAuthStore.setState({ schoolId: null });
    renderAt('/school-manager/parents/p1');
    expect(screen.getByText('No school is assigned to this session')).toBeInTheDocument();
    expect(parentsApi.get).not.toHaveBeenCalled();
    expect(parentsApi.listStudents).not.toHaveBeenCalled();
  });
});

describe('ParentDetailsPage (with a school)', () => {
  beforeEach(() => {
    vi.mocked(parentsApi.get).mockResolvedValue(parent);
    vi.mocked(parentsApi.listStudents).mockResolvedValue(page([student], { page: 1, pageSize: 10, total: 1, totalPages: 1 }) as never);
  });

  it('shows the profile, the address and the students from the dedicated endpoint (by parent id)', async () => {
    renderAt('/school-manager/parents/p1');
    expect(await screen.findByRole('heading', { name: 'أحمد محمد علي', level: 1 })).toBeInTheDocument();
    expect(parentsApi.get).toHaveBeenCalledWith('p1', expect.anything());
    expect(await screen.findByText('عمر أحمد محمد')).toBeInTheDocument();
    expect(parentsApi.listStudents).toHaveBeenCalledWith('p1', { page: '1', pageSize: '10', sort: '-createdAt' }, expect.anything());
    expect(screen.getByText('سمالوط', { selector: '[class*="place"]' })).toBeInTheDocument();
  });

  it('filters students by status using filter[status]', async () => {
    renderAt('/school-manager/parents/p1');
    await screen.findByText('عمر أحمد محمد');
    fireEvent.click(screen.getByRole('button', { name: 'Archived' }));
    await waitFor(() =>
      expect(parentsApi.listStudents).toHaveBeenCalledWith('p1', { page: '1', pageSize: '10', sort: '-createdAt', 'filter[status]': 'ARCHIVED' }, expect.anything()),
    );
  });

  it('ends only this school\'s link after confirmation', async () => {
    vi.mocked(parentsApi.endSchoolLink).mockResolvedValue({ id: 'l1', parentId: 'p1', schoolId: SCHOOL, linkedAt: '', linkedBy: '', unlinkedAt: '2026-10-19T08:00:00.000Z', unlinkedBy: 'u', isActive: false });
    vi.mocked(parentsApi.list).mockResolvedValue(page([], { page: 1, pageSize: 20, total: 0, totalPages: 0 }) as never);
    renderAt('/school-manager/parents/p1');
    fireEvent.click(await screen.findByRole('button', { name: 'End link with this school' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/Their links to other schools/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'End link' }));
    await waitFor(() => expect(parentsApi.endSchoolLink).toHaveBeenCalledWith('p1', SCHOOL));
    expect(await screen.findByText(/is no longer linked to your school/)).toBeInTheDocument();
  });

  it('explains PARENT_HAS_STUDENTS_IN_SCHOOL and keeps the dialog open', async () => {
    vi.mocked(parentsApi.endSchoolLink).mockRejectedValue(new ApiError('business_rule', { status: 422, code: 'PARENT_HAS_STUDENTS_IN_SCHOOL' }));
    renderAt('/school-manager/parents/p1');
    fireEvent.click(await screen.findByRole('button', { name: 'End link with this school' }));
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'End link' }));
    expect(await within(dialog).findByText(/because this parent still has students/)).toBeInTheDocument();
  });

  it('edits only the address and sends it as a string', async () => {
    vi.mocked(parentsApi.updateAddress).mockResolvedValue({ ...parent, address: { ...address, centerName: 'مطاي', villageName: null } });
    renderAt('/school-manager/parents/p1');
    fireEvent.click(await screen.findByRole('button', { name: 'Edit address' }));
    const dialog = await screen.findByRole('dialog');
    const field = within(dialog).getByLabelText('Address') as HTMLInputElement;
    expect(field.value).toBe('المنيا / سمالوط / برمشا');
    expect(within(dialog).getByRole('button', { name: 'Save address' })).toBeDisabled();
    fireEvent.change(field, { target: { value: 'المنيا / مطاي' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save address' }));
    await waitFor(() => expect(parentsApi.updateAddress).toHaveBeenCalledWith('p1', { address: 'المنيا / مطاي' }));
    expect(await screen.findByText('Address updated.')).toBeInTheDocument();
  });
});
