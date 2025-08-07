import { test, expect } from '@playwright/test';
import { aiAssertPage } from '../../src/utils/aiAssert';

test.describe('Post-login: Dashboard smoke', () => {
  test('lands on a dashboard-like page with key widgets @postlogin @smoke', async ({ page }) => {
    await page.goto('/');

    // Expect some authenticated indicator: a navigation bar, user menu, or logout button
    const maybeUser = page.getByRole('button', { name: /user|profile|logout|تسجيل الخروج|حساب/i }).first();
    const nav = page.getByRole('navigation').first();

    await expect.soft(nav).toBeVisible({ timeout: 10000 });
    await expect.soft(maybeUser).toBeVisible();

    // A heading is typically present on dashboard
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });

    const ai = await aiAssertPage(page, 'This should be an authenticated dashboard or landing page. Expect navigational elements, user/account controls, and at least one primary heading or widget.');
    test.info().annotations.push({ type: 'ai', description: ai.reason });
    expect(ai.passed).toBeTruthy();
  });
});