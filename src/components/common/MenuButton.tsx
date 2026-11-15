import { useTranslation } from 'react-i18next';

interface MenuButtonProps {
  open: boolean;
  onClick: () => void;
  controlsId: string;
  className?: string;
}

/** Hamburger button (touch-sized, symmetric icon so it works in both directions). */
export function MenuButton({ open, onClick, controlsId, className = '' }: MenuButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className={`btn icon-btn ${className}`.trim()}
      aria-label={t('nav.menu')}
      aria-expanded={open}
      aria-controls={open ? controlsId : undefined}
      onClick={onClick}
      data-testid="menu-button"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
