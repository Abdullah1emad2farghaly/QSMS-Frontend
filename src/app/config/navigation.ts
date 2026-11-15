import { ROLE_ROUTES, ROUTES } from '@/app/routes/paths';
import type { LandingRole } from '@/types';

/** Navigation entry of the app shell. Business modules add their entries here when they exist. */
export interface NavItem {
  to: string;
  /** i18n key (default namespace). */
  labelKey: string;
  end?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: ROUTES.myDevices, labelKey: 'nav.myDevices' },
  { to: ROUTES.changePassword, labelKey: 'nav.changePassword' },
];

/** While a password change is forced, only this entry is offered. */
export const FORCED_PASSWORD_NAV: readonly NavItem[] = [{ to: ROUTES.changePassword, labelKey: 'nav.changePassword' }];

/** Navigation for the signed-in shell: the active role's home first, then the account screens. */
export const navItemsFor = (active: LandingRole | null): readonly NavItem[] => [
  ...(active ? [{ to: ROLE_ROUTES[active], labelKey: 'nav.home' }] : []),
  ...NAV_ITEMS,
];
