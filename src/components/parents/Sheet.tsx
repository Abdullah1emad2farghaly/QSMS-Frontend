import { useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { Button } from '@/components/ui';
import { CloseIcon } from './ParentParts';
import styles from './Sheet.module.css';

interface SheetProps {
  title: string;
  description?: string;
  onClose: () => void;
  /** While true (a request is running) Escape, the backdrop and the close button are ignored. */
  busy?: boolean;
  children: ReactNode;
  /** Action buttons; stacked on phones (primary first), in a row on tablets and up. */
  footer?: ReactNode;
}

/**
 * Focused editing surface: a bottom sheet on phones and a side panel from `md` up (it opens from the
 * inline-end edge, so it mirrors in RTL). Mounted = open; unmount it to close (state resets with it).
 */
export function Sheet({ title, description, onClose, busy = false, children, footer }: SheetProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const close = () => {
    if (!busy) onClose();
  };
  useModalBehavior(true, panelRef, close);

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} aria-hidden="true" onClick={close} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={styles.panel}
      >
        <span className={styles.grip} aria-hidden="true" />
        <div className={styles.header}>
          <div className={styles.titles}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description && (
              <p id={descId} className={styles.description}>
                {description}
              </p>
            )}
          </div>
          <Button variant="ghost" className="icon-btn" onClick={close} disabled={busy} aria-label={t('actions.close')}>
            <CloseIcon />
          </Button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
