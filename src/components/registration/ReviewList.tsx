import type { ReactNode } from 'react';

interface Section {
  title: string;
  /** Takes the user back to the step that holds these values. */
  editLabel: string;
  onEdit: () => void;
  rows: { label: string; value: ReactNode }[];
}

/** Read-only summary of what will be submitted, with a way back to each step. */
export function ReviewList({ sections }: { sections: Section[] }) {
  return (
    <div className="stack">
      {sections.map((section) => (
        <section key={section.title} className="review-section">
          <div className="review-head">
            <h3 className="review-title">{section.title}</h3>
            <button type="button" className="btn btn-ghost" onClick={section.onEdit}>
              {section.editLabel}
            </button>
          </div>
          <dl className="review-list">
            {section.rows.map((row) => (
              <div key={row.label} className="review-row">
                <dt className="muted">{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
