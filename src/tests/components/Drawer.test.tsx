import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Drawer } from '@/components/ui/Drawer';
import i18n from '@/translation/i18n';

describe('Drawer', () => {
  it('renders nothing when closed', () => {
    render(
      <Drawer open={false} onClose={() => undefined} label="Menu">
        content
      </Drawer>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is an accessible dialog that closes with Escape and the close button, and locks page scroll', async () => {
    await act(() => i18n.changeLanguage('en'));
    const onClose = vi.fn();
    const { unmount } = render(
      <Drawer open onClose={onClose} label="Menu">
        <a href="/x">link</a>
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { name: 'Menu' })).toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);

    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
