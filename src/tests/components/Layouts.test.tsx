import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppShellLayout } from '@/app/layouts/AppShellLayout';
import { PublicLayout } from '@/app/layouts/PublicLayout';
import { createQueryClient } from '@/services/query';
import { useUiStore } from '@/store';
import i18n from '@/translation/i18n';

const renderLayout = (layout: JSX.Element) =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter>
        <Routes>
          <Route element={layout}>
            <Route index element={<p>page body</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(async () => {
  useUiStore.setState({ navOpen: false });
  await act(() => i18n.changeLanguage('en'));
});

describe.each([
  ['PublicLayout', <PublicLayout key="p" />],
  ['AppShellLayout', <AppShellLayout key="a" />],
])('%s', (_name, layout) => {
  it('renders the page and toggles the mobile menu drawer', () => {
    renderLayout(layout);
    expect(screen.getByText('page body')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('menu-button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('menu-button')).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
