import { test, expect } from '@playwright/test';

async function trySearch(page) {
  const search = page.getByRole('searchbox').first().or(page.getByPlaceholder(/search|بحث/i).first());
  if (await search.isVisible()) {
    await search.fill('test');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('domcontentloaded');
    const resultRegion = page.getByRole('region', { name: /results|نتائج/i }).first().or(page.locator('table, ul, ol').first());
    await expect.soft(resultRegion).toBeVisible();
  }
}

test.describe('Post-login: Global search', () => {
  test('perform search where available @search', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await trySearch(page);
  });
});