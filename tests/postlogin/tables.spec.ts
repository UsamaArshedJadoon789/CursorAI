import { test, expect } from '@playwright/test';

async function tryPagination(page) {
  const next = page.getByRole('button', { name: /next|التالي/i }).first().or(page.getByRole('link', { name: /next|التالي/i }).first());
  if (await next.isVisible()) {
    await next.click();
    await page.waitForLoadState('domcontentloaded');
  }
}

async function trySorting(page) {
  const sortable = page.locator('table th[role="button"], table th[aria-sort], table th:has(button)');
  const count = await sortable.count();
  if (count > 0) {
    await sortable.nth(0).click();
    await page.waitForTimeout(500);
    await sortable.nth(0).click();
  }
}

async function tryFiltering(page) {
  const search = page.getByPlaceholder(/search|بحث/i).first().or(page.getByRole('searchbox').first());
  if (await search.isVisible()) {
    await search.fill('test');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('domcontentloaded');
  }
}

test.describe('Post-login: Data tables interactions', () => {
  test('interact with first visible table on key pages @tables', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const candidateLinks = await page.locator('a[href*="list" i], a[href*="table" i], a[href*="index" i]').all();
    const targets = new Set<string>([page.url()]);
    for (const a of candidateLinks.slice(0, 10)) {
      const href = await a.getAttribute('href');
      if (!href) continue;
      targets.add(new URL(href, page.url()).toString());
    }

    for (const url of targets) {
      await test.step(`Tables on ${url}`, async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const table = page.locator('table').first();
        if (!(await table.isVisible())) return;

        await trySorting(page);
        await tryFiltering(page);
        await tryPagination(page);

        await expect(table).toBeVisible();
      });
    }
  });
});