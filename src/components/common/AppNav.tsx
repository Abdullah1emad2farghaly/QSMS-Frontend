import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import type { NavItem } from '@/app/config/navigation';
import styles from './AppNav.module.css';

/** Vertical navigation list used in the sidebar and in the mobile drawer. */
export function AppNav({ items }: { items: readonly NavItem[] }) {
  const { t } = useTranslation();
  if (items.length === 0) return <p className="muted">{t('nav.empty')}</p>;
  return (
    <nav aria-label={t('nav.label')}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`.trim()}
            >
              {t(item.labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
