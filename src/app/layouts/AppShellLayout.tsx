import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import { FORCED_PASSWORD_NAV, mediaMinWidth, navItemsFor } from '@/app/config';
import { AccountActions } from '@/components/auth/AccountActions';
import { RoleSwitcher } from '@/components/auth/RoleSwitcher';
import { useRoleState } from '@/hooks/useRoleState';
import { AppNav } from '@/components/common/AppNav';
import { BrandLink } from '@/components/common/BrandLink';
import { HeaderControls } from '@/components/common/HeaderControls';
import { MenuButton } from '@/components/common/MenuButton';
import { Drawer } from '@/components/ui/Drawer';
import { useAuthStore, useUiStore } from '@/store';
import styles from './AppShellLayout.module.css';

const DRAWER_ID = 'app-shell-nav';

/**
 * Reusable shell for the future signed-in area: header + sidebar + content.
 * Below `lg` the sidebar becomes a drawer; below `md` the header controls move into it.
 * Not routed yet — no protected routes exist (see `protectedRoutes`).
 */
export function AppShellLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navOpen = useUiStore((s) => s.navOpen);
  const setNavOpen = useUiStore((s) => s.setNavOpen);
  const toggleNav = useUiStore((s) => s.toggleNav);
  const close = useCallback(() => setNavOpen(false), [setNavOpen]);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const { active } = useRoleState();
  const navItems = mustChangePassword ? FORCED_PASSWORD_NAV : navItemsFor(active);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname, setNavOpen]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <MenuButton className={styles.menuButton} open={navOpen} onClick={toggleNav} controlsId={DRAWER_ID} />
        <BrandLink className={styles.brand} />
        {!mustChangePassword && <RoleSwitcher className={styles.headerRole} />}
        <HeaderControls className={styles.headerControls} />
        <AccountActions className={styles.account} />
      </header>
      <div className={styles.body}>
        <aside className={styles.sidebar} aria-label={t('nav.label')}>
          <AppNav items={navItems} />
        </aside>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      <Drawer open={navOpen} onClose={close} id={DRAWER_ID} label={t('nav.label')} closeAtMedia={mediaMinWidth('lg')}>
        {!mustChangePassword && <RoleSwitcher />}
        <AppNav items={navItems} />
        <HeaderControls className={styles.drawerControls} />
        <AccountActions className={styles.drawerAccount} />
      </Drawer>
    </div>
  );
}
