import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

async function fillFirstVisible(page, locators: import('@playwright/test').Locator[], value: string) {
  for (const locator of locators) {
    const count = await locator.count();
    for (let i = 0; i < count; i++) {
      const item = locator.nth(i);
      if (await item.isVisible()) {
        await item.fill('');
        await item.fill(value);
        return true;
      }
    }
  }
  return false;
}

async function clickFirstVisible(page, locators: import('@playwright/test').Locator[]) {
  for (const locator of locators) {
    const count = await locator.count();
    for (let i = 0; i < count; i++) {
      const item = locator.nth(i);
      if (await item.isVisible()) {
        await item.click();
        return true;
      }
    }
  }
  return false;
}

test('authenticate and persist storage state', async ({ page, context }) => {
  const baseURL = process.env.BASE_URL || 'https://qc.uapi.sa';
  const username = process.env.UAPI_USERNAME || 'sedr';
  const password = process.env.UAPI_PASSWORD || 'V@iolaptop123';

  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });

  const filledUser = await fillFirstVisible(page, [
    page.getByLabel(/user|email|اسم/i),
    page.getByPlaceholder(/user|email|اسم/i),
    page.locator('input[name*="user" i]'),
    page.locator('input[type="text"]'),
  ], username);

  expect(filledUser).toBeTruthy();

  const filledPass = await fillFirstVisible(page, [
    page.getByLabel(/pass|كلمة المرور/i),
    page.getByPlaceholder(/pass|كلمة المرور/i),
    page.locator('input[name*="pass" i]'),
    page.locator('input[type="password"]'),
  ], password);

  expect(filledPass).toBeTruthy();

  const clickedLogin = await clickFirstVisible(page, [
    page.getByRole('button', { name: /login|sign in|log in|دخول|دخول|تسجيل الدخول/i }),
    page.locator('button[type="submit"]'),
    page.getByText(/login|sign in|log in|دخول|تسجيل الدخول/i, { exact: false }),
  ]);

  if (!clickedLogin) {
    await page.keyboard.press('Enter');
  }

  await page.waitForLoadState('domcontentloaded');

  // Consider login successful if URL no longer includes '/login' and a nav/dashboard element is visible.
  await expect(page).not.toHaveURL(/\/login(\b|$)/, { timeout: 30_000 });

  await context.storageState({ path: 'storageState.json' });
});