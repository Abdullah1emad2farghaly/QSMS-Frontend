import type { ReactNode } from 'react';

interface AlertProps {
  variant: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  children?: ReactNode;
  /** Errors interrupt screen readers (`alert`); everything else is polite (`status`). */
  className?: string;
}

export function Alert({ variant, title, children, className = '' }: AlertProps) {
  return (
    <div className={`alert alert-${variant} ${className}`.trim()} role={variant === 'error' ? 'alert' : 'status'}>
      <div className="alert-body">
        {title && <strong className="alert-title">{title}</strong>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
