import { test, expect } from '@playwright/test';
import { aiAssertPage } from '../../src/utils/aiAssert';

const invalidUsers = [
  { u: 'unknown.user@example.com', p: 'wrongpass!' },
  { u: 'sedr', p: 'incorrect' },
  { u: ' ', p: ' ' },
];

async function locateInputs(page: any) {
  const user = page.getByLabel(/user|email|اسم/i).first().or(page.getByPlaceholder(/user|email|اسم/i).first());
  const pass = page.getByLabel(/pass|كلمة المرور/i).first().or(page.getByPlaceholder(/pass|كلمة المرور/i).first());
  return { user, pass };
}

test.describe('Pre-login: Login page UX and validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('Login page renders core elements @smoke', async ({ page }) => {
    await expect(page).toHaveTitle(/login|sign in|تسجيل|دخول/i);
    await expect(page.getByRole('heading')).toBeVisible({ timeout: 5000 });

    const userInput = page.getByLabel(/user|email|اسم/i).first().or(page.getByPlaceholder(/user|email|اسم/i).first());
    const passInput = page.getByLabel(/pass|كلمة المرور/i).first().or(page.getByPlaceholder(/pass|كلمة المرور/i).first());
    await expect(userInput).toBeVisible();
    await expect(passInput).toBeVisible();

    const loginBtn = page.getByRole('button', { name: /login|sign in|log in|دخول|تسجيل الدخول/i }).first();
    await expect(loginBtn).toBeVisible();

    const ai = await aiAssertPage(page, 'The screen should look like an authentication/login screen with username and password fields and a submit action.');
    test.info().annotations.push({ type: 'ai', description: ai.reason });
    expect(ai.passed).toBeTruthy();
  });

  test('Required field validation appears when submitting empty form', async ({ page }) => {
    const loginBtn = page.getByRole('button', { name: /login|sign in|log in|دخول|تسجيل الدخول/i }).first();
    await loginBtn.click();

    // Expect some validation hint to appear
    const validation = page.getByText(/required|invalid|please|الزامي|مطلوب/i).first();
    await expect(validation).toBeVisible();
  });

  for (const { u, p } of invalidUsers) {
    test(`Invalid credentials are rejected: ${u} / ${p}`, async ({ page }) => {
      const { user, pass } = await locateInputs(page);
      await user.fill(u);
      await pass.fill(p);
      await page.getByRole('button', { name: /login|sign in|log in|دخول|تسجيل الدخول/i }).first().click();

      const error = page.getByText(/invalid|incorrect|not match|failed|خطأ|غير صحيحة/i).first();
      await expect(error).toBeVisible({ timeout: 10000 });

      const ai = await aiAssertPage(page, 'After submitting invalid login credentials, the UI should display a clear error message and should NOT allow navigation to an authenticated page.');
      test.info().annotations.push({ type: 'ai', description: ai.reason });
      expect(ai.passed).toBeTruthy();
    });
  }

  test('Password field is masked and toggle (if present) works', async ({ page }) => {
    const pwd = page.getByLabel(/pass|كلمة المرور/i).first().or(page.getByPlaceholder(/pass|كلمة المرور/i).first());
    await pwd.fill('some-secret');
    await expect(pwd).toHaveAttribute('type', /password/i);

    const toggle = page.getByRole('button', { name: /show|hide|eye|عرض|اخفاء/i }).first();
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(pwd).not.toHaveAttribute('type', /password/i);
    }
  });

  test('Forgot password / support link (if present) is reachable', async ({ page }) => {
    const link = page.getByRole('link', { name: /forgot|reset|support|نسيت|استعادة/i }).first();
    if (await link.isVisible()) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        link.click(),
      ]);
      await expect(page).not.toHaveURL(/\/login\b/);
    }
  });
});