import { test, expect } from '@playwright/test';
import { AppShell } from '../../src/pages/AppShell';

const MAX_MODULES = Number(process.env.MAX_MODULES_PER_SUITE || 20);

async function tryBulk(page) {
  const rowChecks = page.locator('table tbody input[type="checkbox"]');
  const count = await rowChecks.count();
  if (count >= 2) {
    await rowChecks.nth(0).check({ force: true }).catch(() => {});
    await rowChecks.nth(1).check({ force: true }).catch(() => {});
    const bulk = page.getByRole('button', { name: /bulk|actions|إجراءات|عمليات/i }).first().or(
      page.getByRole('menu').locator('button, a').first()
    );
    if (await bulk.isVisible()) {
      await bulk.click();
      const firstAction = page.getByRole('menuitem').first().or(page.locator('[role="menu"] a, [role="menu"] button').first());
      if (await firstAction.isVisible()) {
        await firstAction.click();
      }
    }
  }
}

test.describe('Post-login: Modules bulk actions @modules @bulk', () => {
  test('select multiple rows and open bulk actions where available', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const modules = (await new AppShell(page).listModules(200)).slice(0, MAX_MODULES);
    for (const m of modules) {
      await test.step(`Bulk on ${m.name}`, async () => {
        await page.goto(m.href, { waitUntil: 'domcontentloaded' });
        await tryBulk(page);
        await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
      });
    }
  });
});