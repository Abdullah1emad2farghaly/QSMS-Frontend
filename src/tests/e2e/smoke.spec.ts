import { expect, test, type Page } from '@playwright/test';

/** mobile 320–375, standard mobile 390–430, tablet, laptop, large desktop */
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1440, 1920];

const hasHorizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

/** Controls live in the drawer below `md`: open it when the menu button is visible. */
async function openControlsIfCollapsed(page: Page) {
  const menu = page.getByTestId('menu-button');
  if (await menu.isVisible()) await menu.click();
}

test('root route shows the landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

for (const width of WIDTHS) {
  test(`no horizontal overflow at ${width}px in Arabic (RTL) and English (LTR), light and dark`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(await hasHorizontalOverflow(page)).toBe(false);

    await openControlsIfCollapsed(page);
    await page.locator('[data-testid="language-switcher"]:visible').click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await page.keyboard.press('Escape');
    expect(await hasHorizontalOverflow(page)).toBe(false);

    await openControlsIfCollapsed(page);
    await page.locator('[data-testid="theme-toggle"]:visible').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.keyboard.press('Escape');
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
}

const PUBLIC_PAGES = ['/login', '/forgot-password', '/register', '/register/organization', '/register/school'];

for (const route of PUBLIC_PAGES) {
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    test(`${route} has no horizontal overflow at ${width}px (RTL and LTR)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await hasHorizontalOverflow(page)).toBe(false);

      await page.evaluate(() => localStorage.setItem('qsms.preferences', JSON.stringify({ state: { language: 'en', theme: 'dark' }, version: 0 })));
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }
}

test('protected pages send anonymous visitors to sign-in', async ({ page }) => {
  for (const route of ['/my-devices', '/change-password', '/select-role', '/main-admin', '/organization-manager', '/school-manager', '/teacher', '/parent']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test('menu button is shown on mobile and hidden on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  await expect(page.getByTestId('menu-button')).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByTestId('menu-button')).toBeHidden();
});
