import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import { mediaMinWidth } from '@/app/config';
import { BrandLink } from '@/components/common/BrandLink';
import { HeaderControls } from '@/components/common/HeaderControls';
import { MenuButton } from '@/components/common/MenuButton';
import { Drawer } from '@/components/ui/Drawer';
import { useUiStore } from '@/store';
import styles from './PublicLayout.module.css';

const DRAWER_ID = 'public-menu';

/**
 * Public shell (mobile-first). Below `md` the theme/language controls live in a drawer opened
 * by the menu button; from `md` up they sit inline in the header.
 */
export function PublicLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navOpen = useUiStore((s) => s.navOpen);
  const setNavOpen = useUiStore((s) => s.setNavOpen);
  const toggleNav = useUiStore((s) => s.toggleNav);
  const close = useCallback(() => setNavOpen(false), [setNavOpen]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname, setNavOpen]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <BrandLink className={styles.brand} />
        <HeaderControls className={styles.inlineControls} />
        <MenuButton className={styles.menuButton} open={navOpen} onClick={toggleNav} controlsId={DRAWER_ID} />
      </header>
      <Drawer open={navOpen} onClose={close} id={DRAWER_ID} label={t('nav.menu')} closeAtMedia={mediaMinWidth('md')}>
        <HeaderControls className={styles.drawerControls} />
      </Drawer>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
