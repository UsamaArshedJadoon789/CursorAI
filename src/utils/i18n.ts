import { Page } from '@playwright/test';

export async function switchLanguageIfPossible(page: Page, target: 'ar' | 'en') {
  const button = page.getByRole('button', { name: /english|arabic|العربية|english/i }).first().or(
    page.getByRole('link', { name: /english|arabic|العربية|english/i }).first()
  );
  if (await button.isVisible()) {
    await button.click();
    await page.waitForLoadState('domcontentloaded');
  }
  // Heuristic wait for direction change if Arabic
  if (target === 'ar') {
    await page.waitForSelector('html[dir="rtl"]', { timeout: 3000 }).catch(() => {});
  } else {
    await page.waitForSelector('html[dir="ltr"]', { timeout: 3000 }).catch(() => {});
  }
}