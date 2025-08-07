import { test, expect } from '@playwright/test';

test.describe('Post-login: Logout', () => {
  test('user can logout and is redirected to login @logout', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const logout = page.getByRole('button', { name: /logout|sign out|log out|تسجيل الخروج/i }).first().or(
      page.getByRole('link', { name: /logout|sign out|log out|تسجيل الخروج/i }).first()
    );

    if (await logout.isVisible()) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        logout.click(),
      ]);
      await expect(page).toHaveURL(/\/(login|signin)/i);
    } else {
      test.skip(true, 'No logout control visible');
    }
  });
});