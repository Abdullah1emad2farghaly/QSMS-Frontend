import type { ReactNode } from 'react';
import styles from './AuthPageLayout.module.css';

interface AuthPageLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Wider panel for long forms. */
  wide?: boolean;
}

/** Centered card used by every authentication screen (inside the public layout). */
export function AuthPageLayout({ title, subtitle, children, footer, wide = false }: AuthPageLayoutProps) {
  return (
    <div className={styles.page}>
      <section className={`${styles.panel} ${wide ? styles.wide : ''}`.trim()}>
        <span className={styles.mark} aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6.5C10.4 5.3 8 4.8 4.5 5v12c3.5-.2 5.9.3 7.5 1.5 1.6-1.2 4-1.7 7.5-1.5V5c-3.5-.2-5.9.3-7.5 1.5z" />
            <path d="M12 6.5v12" />
          </svg>
        </span>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={`muted ${styles.subtitle}`}>{subtitle}</p>}
        </header>
        <div className="card">{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </section>
    </div>
  );
}
