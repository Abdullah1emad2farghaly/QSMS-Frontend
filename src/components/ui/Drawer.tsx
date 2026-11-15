import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import styles from './Drawer.module.css';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  id?: string;
  /** Media query at which the drawer closes itself (e.g. when a persistent sidebar takes over). */
  closeAtMedia?: string;
  children: ReactNode;
}

/**
 * Off-canvas panel for small screens. Opens from the inline-start edge (left in LTR, right in RTL),
 * closes with Escape / backdrop / close button, traps focus, locks page scroll and restores focus.
 */
export function Drawer({ open, onClose, label, id, closeAtMedia, children }: DrawerProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useModalBehavior(open, panelRef, onClose);

  useEffect(() => {
    if (!open || !closeAtMedia || typeof window === 'undefined' || !window.matchMedia) return;
    const list = window.matchMedia(closeAtMedia);
    const onChange = () => {
      if (list.matches) onCloseRef.current();
    };
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [open, closeAtMedia]);

  if (!open) return null;

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} aria-hidden="true" onClick={onClose} />
      <div ref={panelRef} id={id} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={styles.panel}>
        <div className={styles.header}>
          <button type="button" className="btn" onClick={onClose}>
            {t('drawer.close')}
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
