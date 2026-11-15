import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OrganizationRegistrationPage from '@/pages/public/OrganizationRegistrationPage';
import SchoolSubmissionPage from '@/pages/public/SchoolSubmissionPage';
import { createQueryClient } from '@/services/query';
import { useAuthStore } from '@/store';
import i18n from '@/translation/i18n';

vi.mock('@/services/registration/registrationApi', () => ({
  registrationApi: {
    getCountries: vi.fn(),
    getGovernorates: vi.fn(),
    getOrganizations: vi.fn(),
    registerOrganization: vi.fn(),
    submitSchool: vi.fn(),
  },
}));
import { registrationApi } from '@/services/registration/registrationApi';

const api = vi.mocked(registrationApi);
const renderPage = (ui: JSX.Element) =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );

const next = () => fireEvent.click(screen.getByRole('button', { name: 'Next' }));
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value } });

beforeEach(async () => {
  Object.values(api).forEach((fn) => fn.mockReset());
  useAuthStore.getState().clear();
  api.getCountries.mockResolvedValue([{ id: 'c1', name: 'مصر' }]);
  api.getGovernorates.mockResolvedValue([{ id: 'g1', name: 'القاهرة' }]);
  await act(() => i18n.changeLanguage('en'));
});
afterEach(() => {
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
});

async function fillOrganization(anonymous: boolean) {
  change('Full name', 'Ali');
  if (anonymous) {
    change('Phone number', '01012345678');
    change('Password', '123456');
  }
  next();
  await screen.findByRole('heading', { name: 'Organization' });
  change('Organization name', 'Nour Organization');
  await screen.findByRole('option', { name: 'مصر' });
  change('Country', 'c1');
  await screen.findByRole('option', { name: 'القاهرة' });
  change('Governorate', 'g1');
  next();
  await screen.findByRole('heading', { name: 'Review' });
}

describe('Organization registration', () => {
  const created = {
    organization: { id: 'o1', code: 'ORG-000001', name: 'Nour Organization', status: 'ACTIVE', countryId: 'c1', address: { governorateId: 'g1', centerName: null, villageName: null }, createdAt: '', updatedAt: '' },
    applicant: { userId: 'u1', accountCreated: true },
  } as never;

  it('loads governorates by countryId only, then submits the documented body (anonymous: password included)', async () => {
    api.registerOrganization.mockResolvedValue(created);
    renderPage(<OrganizationRegistrationPage />);
    await fillOrganization(true);
    expect(api.getGovernorates.mock.calls[0]![0]).toEqual({ countryId: 'c1' });
    fireEvent.click(screen.getByRole('button', { name: 'Register organization' }));
    await waitFor(() =>
      expect(api.registerOrganization).toHaveBeenCalledWith({
        applicant: { name: 'Ali', phone: '01012345678', password: '123456' },
        organization: { name: 'Nour Organization', countryId: 'c1', governorateId: 'g1' },
      }),
    );
    expect(await screen.findByText('Organization registered')).toBeInTheDocument();
    expect(screen.getByText('ORG-000001')).toBeInTheDocument();
    // An anonymous applicant is never logged in automatically.
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('authenticated applicants: no password field and no password sent; phone comes from the account', async () => {
    useAuthStore.setState({ status: 'authenticated', accessToken: 't', user: { id: 'u1', phone: '0100777' }, roles: [] });
    api.registerOrganization.mockResolvedValue(created);
    renderPage(<OrganizationRegistrationPage />);
    expect(screen.queryByLabelText(/^Password/)).not.toBeInTheDocument();
    await fillOrganization(false);
    fireEvent.click(screen.getByRole('button', { name: 'Register organization' }));
    await waitFor(() => expect(api.registerOrganization).toHaveBeenCalled());
    expect(api.registerOrganization.mock.calls[0]![0].applicant).toEqual({ name: 'Ali', phone: '0100777' });
  });

  it('clears the governorate when the country changes', async () => {
    api.getCountries.mockResolvedValue([{ id: 'c1', name: 'مصر' }, { id: 'c2', name: 'الأردن' }]);
    renderPage(<OrganizationRegistrationPage />);
    change('Full name', 'Ali');
    change('Phone number', '0101');
    change('Password', '123456');
    next();
    await screen.findByRole('option', { name: 'الأردن' });
    change('Country', 'c1');
    await screen.findByRole('option', { name: 'القاهرة' });
    change('Governorate', 'g1');
    change('Country', 'c2');
    await waitFor(() => expect((screen.getByLabelText('Governorate') as HTMLSelectElement).value).toBe(''));
  });

  it('blocks the first step on invalid input (password required when anonymous)', async () => {
    renderPage(<OrganizationRegistrationPage />);
    change('Full name', 'Ali');
    change('Phone number', '0101');
    next();
    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'Applicant' })).toBeInTheDocument();
  });

  it('shows an error state with retry when countries cannot be loaded', async () => {
    api.getCountries.mockRejectedValueOnce(new Error('x'));
    renderPage(<OrganizationRegistrationPage />);
    change('Full name', 'Ali');
    change('Phone number', '0101');
    change('Password', '123456');
    next();
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('School submission', () => {
  const orgPage = {
    success: true,
    data: [{ id: 'o1', name: 'Nour Organization' }],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  } as never;
  const submitted = {
    school: { id: 's1', code: 'SC-000001', name: 'Hope School', status: 'PENDING' },
    applicant: { userId: 'u1', accountCreated: true },
  } as never;

  it('runs the full workflow: organization → governorates by organizationId → GPS → pending confirmation', async () => {
    api.getOrganizations.mockResolvedValue(orgPage);
    api.submitSchool.mockResolvedValue(submitted);
    const geo = vi.fn((ok: PositionCallback) => ok({ coords: { latitude: 30.0444, longitude: 31.2357, accuracy: 12 } } as GeolocationPosition));
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: geo } });

    renderPage(<SchoolSubmissionPage />);
    change('Full name', 'Ali');
    change('Phone number', '01012345678');
    change('Password', '123456');
    next();

    fireEvent.click(await screen.findByRole('radio', { name: 'Nour Organization' }));
    next();

    await screen.findByRole('option', { name: 'القاهرة' });
    expect(api.getGovernorates.mock.calls[0]![0]).toEqual({ organizationId: 'o1' });
    change('Governorate', 'g1');
    change('School name', 'Hope School');
    next();

    expect(geo).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Capture my location' }));
    expect(screen.getByText('Location captured')).toBeInTheDocument();
    next();

    await screen.findByRole('heading', { name: 'Review' });
    fireEvent.click(screen.getByRole('button', { name: 'Submit school' }));
    await waitFor(() => expect(api.submitSchool).toHaveBeenCalledTimes(1));
    expect(api.submitSchool.mock.calls[0]![0]).toEqual({
      applicant: { name: 'Ali', phone: '01012345678', password: '123456' },
      organizationId: 'o1',
      school: { name: 'Hope School', governorateId: 'g1', gps: { latitude: 30.0444, longitude: 31.2357, accuracyMeters: 12 } },
    });
    expect(await screen.findByText('School submitted')).toBeInTheDocument();
    expect(screen.getByText('SC-000001')).toBeInTheDocument();
    expect(screen.getByText('Pending review')).toBeInTheDocument();
    expect(screen.getByText(/must review it before the school becomes active/)).toBeInTheDocument();
  });

  it('cannot leave the location step without an accurate reading', async () => {
    api.getOrganizations.mockResolvedValue(orgPage);
    const geo = vi.fn((ok: PositionCallback) => ok({ coords: { latitude: 1, longitude: 1, accuracy: 50 } } as GeolocationPosition));
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: geo } });

    renderPage(<SchoolSubmissionPage />);
    change('Full name', 'Ali');
    change('Phone number', '0101');
    change('Password', '123456');
    next();
    fireEvent.click(await screen.findByRole('radio', { name: 'Nour Organization' }));
    next();
    await screen.findByRole('option', { name: 'القاهرة' });
    change('Governorate', 'g1');
    change('School name', 'Hope School');
    next();
    fireEvent.click(await screen.findByRole('button', { name: 'Capture my location' }));
    expect(screen.getByText('The location is not accurate enough')).toBeInTheDocument();
    next();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Location' })).toBeInTheDocument());
    expect(screen.queryByRole('heading', { name: 'Review' })).not.toBeInTheDocument();
  });

  it('organization lookup: shows an empty state and supports load more', async () => {
    api.getOrganizations.mockResolvedValueOnce({ success: true, data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } as never);
    const { unmount } = renderPage(<SchoolSubmissionPage />);
    change('Full name', 'Ali');
    change('Phone number', '0101');
    change('Password', '123456');
    next();
    expect(await screen.findByText('No organizations are available yet.')).toBeInTheDocument();
    unmount();

    api.getOrganizations.mockReset();
    api.getOrganizations
      .mockResolvedValueOnce({ success: true, data: [{ id: 'o1', name: 'First' }], meta: { page: 1, pageSize: 20, total: 2, totalPages: 2 } } as never)
      .mockResolvedValueOnce({ success: true, data: [{ id: 'o2', name: 'Second' }], meta: { page: 2, pageSize: 20, total: 2, totalPages: 2 } } as never);
    renderPage(<SchoolSubmissionPage />);
    change('Full name', 'Ali');
    change('Phone number', '0101');
    change('Password', '123456');
    next();
    await screen.findByRole('radio', { name: 'First' });
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByRole('radio', { name: 'Second' });
    expect(api.getOrganizations.mock.calls[0]![0]).toEqual({ page: '1', pageSize: '20' });
    expect(api.getOrganizations.mock.calls[1]![0]).toEqual({ page: '2', pageSize: '20' });
  });
});
