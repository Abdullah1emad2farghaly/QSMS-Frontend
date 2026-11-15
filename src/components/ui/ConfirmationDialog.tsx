import { useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { Alert } from './Alert';
import { Button } from './Button';
import styles from './ConfirmationDialog.module.css';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Destructive actions use the danger style. */
  destructive?: boolean;
  loading?: boolean;
  /** Error from the last attempt; the dialog stays open so the user can retry or cancel. */
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Accessible modal confirmation: focus trap, Escape, scroll lock, loading and error states. */
export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  loading = false,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  // Escape / backdrop are ignored while the request is running.
  const close = () => {
    if (!loading) onCancel();
  };
  useModalBehavior(open, panelRef, close);

  if (!open) return null;

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} aria-hidden="true" onClick={close} />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={styles.panel}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <div id={descId} className={styles.description}>
          {description}
        </div>
        {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
        <div className={styles.actions}>
          <Button onClick={close} disabled={loading}>
            {t('actions.cancel')}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
