import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LandingPage from '@/pages/public/LandingPage';
import i18n from '@/translation/i18n';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('LandingPage', () => {
  it('renders the English title and status message', async () => {
    await act(() => i18n.changeLanguage('en'));
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole('heading', { name: 'Quran School Management System' })).toBeInTheDocument();
    expect(screen.getByText(/currently under development/i)).toBeInTheDocument();
  });

  it('renders Arabic content', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole('heading', { name: 'نظام إدارة مدرسة القرآن' })).toBeInTheDocument();
  });

  it('shows the responsive verification cards and grid', async () => {
    await act(() => i18n.changeLanguage('en'));
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole('heading', { name: 'Screen size' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Responsive grid' })).toBeInTheDocument();
    expect(screen.getByText('Item 8')).toBeInTheDocument();
  });
});
