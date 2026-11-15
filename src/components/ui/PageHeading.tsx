import type { ReactNode } from 'react';

interface PageHeadingProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeading({ title, description, actions }: PageHeadingProps) {
  return (
    <header className="page-heading">
      <div style={{ minInlineSize: 0 }}>
        <h1 className="page-heading-title">{title}</h1>
        {description && <p className="muted page-heading-desc">{description}</p>}
      </div>
      {actions && <div className="row-wrap">{actions}</div>}
    </header>
  );
}
