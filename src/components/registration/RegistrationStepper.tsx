import { useTranslation } from 'react-i18next';
import styles from './RegistrationStepper.module.css';

/** Horizontal progress list; on narrow screens only the current step's label is shown. */
export function RegistrationStepper({ steps, current }: { steps: string[]; current: number }) {
  const { t } = useTranslation('registration');
  return (
    <nav aria-label={t('stepper.label')}>
      <p className={styles.summary}>{t('stepper.step', { current: current + 1, total: steps.length })}</p>
      <ol className={styles.list}>
        {steps.map((label, index) => (
          <li
            key={label}
            className={`${styles.item} ${index === current ? styles.current : ''} ${index < current ? styles.done : ''}`.trim()}
            aria-current={index === current ? 'step' : undefined}
          >
            <span className={styles.dot} aria-hidden="true">
              {index < current ? '✓' : index + 1}
            </span>
            <span className={styles.label}>{label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
