import { useTranslation } from 'react-i18next';
import type { ParentAddress, StudentStatus } from '@/types';
import { addressParts, monogram } from '@/utils/parents';
import styles from './parts.module.css';

/** The parent's initial inside a ringed seal. Decorative: the name is always written next to it. */
export function Monogram({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <span className={[styles.seal, size === 'lg' && styles.sealLg].filter(Boolean).join(' ')} aria-hidden="true">
      {monogram(name)}
    </span>
  );
}

/** "Governorate / Center / Village" — only the parts that exist; the governorate leads. */
export function AddressLine({ address }: { address: Pick<ParentAddress, 'governorateName' | 'centerName' | 'villageName'> }) {
  const parts = addressParts(address);
  return (
    <span className={styles.address}>
      {parts.map((part, index) => (
        <span key={`${index}-${part}`} className={styles.addressPart}>
          {index > 0 && (
            <span className={styles.sep} aria-hidden="true">
              /
            </span>
          )}
          <span className={index === 0 ? styles.addressMain : undefined}>{part}</span>
        </span>
      ))}
    </span>
  );
}

export function StatusChip({ status }: { status: StudentStatus }) {
  const { t } = useTranslation('parents');
  return <span className={[styles.chip, styles[`chip${status}`]].filter(Boolean).join(' ')}>{t(`status.${status}`)}</span>;
}

const ICON = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export const ChevronIcon = () => (
  <svg {...ICON}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const BackIcon = () => (
  <svg {...ICON}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const CloseIcon = () => (
  <svg {...ICON}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const PlusIcon = () => (
  <svg {...ICON}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const PencilIcon = () => (
  <svg {...ICON}>
    <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
  </svg>
);
