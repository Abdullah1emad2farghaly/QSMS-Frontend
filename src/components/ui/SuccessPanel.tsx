import type { ReactNode } from 'react';

interface SuccessPanelProps {
  title: string;
  description?: string;
  /** Key facts (reference code, status, …). */
  details?: { label: string; value: ReactNode }[];
  children?: ReactNode;
}

/** Full-width success state with an optional definition list and follow-up actions. */
export function SuccessPanel({ title, description, details, children }: SuccessPanelProps) {
  return (
    <section className="card success-panel" role="status" aria-live="polite">
      <span className="success-panel-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <h2 className="success-panel-title">{title}</h2>
      {description && <p className="muted success-panel-desc">{description}</p>}
      {details && details.length > 0 && (
        <dl className="success-panel-details">
          {details.map((item) => (
            <div key={item.label} className="success-panel-row">
              <dt className="muted">{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children && <div className="success-panel-actions">{children}</div>}
    </section>
  );
}
