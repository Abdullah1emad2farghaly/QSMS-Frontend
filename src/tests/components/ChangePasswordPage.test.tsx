import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage';
import { ApiError } from '@/services/api';
import { createQueryClient } from '@/services/query';
import { useAuthStore } from '@/store';
import i18n from '@/translation/i18n';

vi.mock('@/services/auth/authActions', () => ({ changePassword: vi.fn(), logout: vi.fn() }));
import { changePassword } from '@/services/auth/authActions';

const renderPage = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter>
        <ChangePasswordPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const fill = (current: string, next: string, confirm = next) => {
  fireEvent.change(screen.getByLabelText('Current password'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: confirm } });
  fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
};

beforeEach(async () => {
  vi.mocked(changePassword).mockReset();
  useAuthStore.setState({ status: 'authenticated', mustChangePassword: false });
  await act(() => i18n.changeLanguage('en'));
});

describe('ChangePasswordPage', () => {
  it('validates length, confirmation and difference locally', async () => {
    renderPage();
    fill('oldpass', 'abc');
    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('rejects a new password equal to the current one', async () => {
    renderPage();
    fill('samepass', 'samepass');
    expect(await screen.findByText(/must be different from the current one/)).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('sends only currentPassword/newPassword and shows the success state', async () => {
    vi.mocked(changePassword).mockResolvedValue(undefined);
    renderPage();
    fill('oldpass', 'newpass');
    expect(await screen.findByText('Password changed')).toBeInTheDocument();
    expect(changePassword).toHaveBeenCalledWith({ currentPassword: 'oldpass', newPassword: 'newpass' });
  });

  it('places CURRENT_PASSWORD_INCORRECT on the current-password field', async () => {
    vi.mocked(changePassword).mockRejectedValue(new ApiError('validation', { status: 400, code: 'CURRENT_PASSWORD_INCORRECT' }));
    renderPage();
    fill('wrongpass', 'newpass');
    expect(await screen.findByText('The current password is incorrect.')).toBeInTheDocument();
  });

  it('explains a forced change and offers sign-out', async () => {
    useAuthStore.setState({ mustChangePassword: true });
    renderPage();
    expect(screen.getByText('You must change your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Change password' })).toBeInTheDocument());
  });
});
