import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyDevicesPage from '@/pages/auth/MyDevicesPage';
import { createQueryClient } from '@/services/query';
import i18n from '@/translation/i18n';

vi.mock('@/services/auth/authApi', () => ({ authApi: { listSessions: vi.fn() } }));
vi.mock('@/services/auth/authActions', () => ({
  revokeSession: vi.fn(),
  logoutAll: vi.fn(),
  logout: vi.fn(),
}));
import { logoutAll, revokeSession } from '@/services/auth/authActions';
import { authApi } from '@/services/auth/authApi';

const sessions = {
  maxActiveSessions: 3,
  items: [
    { id: 's1', deviceLabel: 'Chrome on Windows', createdAt: '2026-11-01T10:00:00.000Z', lastActiveAt: '2026-11-12T09:30:00.000Z', expiresAt: '2026-12-01T10:00:00.000Z', isCurrent: true },
    { id: 's2', deviceLabel: 'Firefox on Android', createdAt: '2026-11-02T10:00:00.000Z', lastActiveAt: '2026-11-11T09:30:00.000Z', expiresAt: '2026-12-02T10:00:00.000Z', isCurrent: false },
  ],
};

const renderPage = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/my-devices']}>
        <Routes>
          <Route path="/my-devices" element={<MyDevicesPage />} />
          <Route path="/login" element={<p>login screen</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(async () => {
  vi.mocked(authApi.listSessions).mockReset().mockResolvedValue(sessions);
  vi.mocked(revokeSession).mockReset().mockResolvedValue(undefined);
  vi.mocked(logoutAll).mockReset().mockResolvedValue(undefined);
  await act(() => i18n.changeLanguage('en'));
});

describe('MyDevicesPage', () => {
  it('lists sessions with the current-device indicator and the active count', async () => {
    renderPage();
    expect(await screen.findByText('Chrome on Windows')).toBeInTheDocument();
    expect(screen.getByText('Firefox on Android')).toBeInTheDocument();
    expect(screen.getByText('This device')).toBeInTheDocument();
    expect(screen.getByText('2 of 3 active devices')).toBeInTheDocument();
  });

  it('shows an error state with retry', async () => {
    vi.mocked(authApi.listSessions).mockRejectedValueOnce(new Error('x'));
    renderPage();
    expect(await screen.findByText('Could not load your devices')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Chrome on Windows')).toBeInTheDocument();
  });

  it('revokes another device after confirmation and refreshes the list', async () => {
    renderPage();
    await screen.findByText('Firefox on Android');
    fireEvent.click(screen.getByRole('button', { name: /Sign out this device — Firefox on Android/ }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sign out this device' }));
    await waitFor(() => expect(revokeSession).toHaveBeenCalledWith('s2', false));
    await waitFor(() => expect(authApi.listSessions).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('The device was signed out.')).toBeInTheDocument();
  });

  it('revoking the current device uses the current-session flow', async () => {
    renderPage();
    await screen.findByText('Chrome on Windows');
    fireEvent.click(screen.getByRole('button', { name: /Sign out of this device — Chrome on Windows/ }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Sign out of this device' }));
    await waitFor(() => expect(revokeSession).toHaveBeenCalledWith('s1', true));
  });

  it('asks for confirmation before signing out of all devices, then goes to sign-in', async () => {
    renderPage();
    await screen.findByText('Chrome on Windows');
    fireEvent.click(screen.getByRole('button', { name: 'Sign out of all devices' }));
    const dialog = screen.getByRole('alertdialog');
    expect(logoutAll).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sign out of all devices' }));
    await waitFor(() => expect(logoutAll).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('login screen')).toBeInTheDocument();
  });

  it('cancel closes the dialog without calling the API', async () => {
    renderPage();
    await screen.findByText('Firefox on Android');
    fireEvent.click(screen.getByRole('button', { name: /Sign out this device — Firefox on Android/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(revokeSession).not.toHaveBeenCalled();
  });
});
