import { test, expect } from '@playwright/test';
import { AppShell } from '../../src/pages/AppShell';

const MAX_MODULES = Number(process.env.MAX_MODULES_PER_SUITE || 20);

async function openDetails(page) {
  const row = page.locator('table tbody tr').first();
  if (await row.isVisible()) {
    const view = row.getByRole('link').first().or(row.getByRole('button').first()).or(row);
    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      view.click(),
    ]);
  }
}

async function navigateTabs(page) {
  const tabs = page.getByRole('tab');
  const count = await tabs.count();
  for (let i = 0; i < Math.min(count, 10); i++) {
    await tabs.nth(i).click();
    await expect(page.getByRole('tabpanel').nth(i)).toBeVisible();
  }
}

test.describe('Post-login: Modules details tabs @modules @tabs', () => {
  test('open tabs in details pages', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const modules = (await new AppShell(page).listModules(200)).slice(0, MAX_MODULES);

    for (const m of modules) {
      await test.step(`Tabs in ${m.name}`, async () => {
        await page.goto(m.href, { waitUntil: 'domcontentloaded' });
        await openDetails(page);
        await navigateTabs(page);
      });
    }
  });
});