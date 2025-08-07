import { test, expect } from '@playwright/test';
import { AppShell } from '../../src/pages/AppShell';
import { aiAssertPage } from '../../src/utils/aiAssert';

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

test.describe('Post-login: Modules details pages @modules @details', () => {
  test('open first record details where possible and validate', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const modules = (await new AppShell(page).listModules(200)).slice(0, MAX_MODULES);
    for (const m of modules) {
      await test.step(`Details in ${m.name}`, async () => {
        await page.goto(m.href, { waitUntil: 'domcontentloaded' });
        await openDetails(page);
        // Validate presence of labels/values or summary
        const dl = page.locator('dl, .detail, .details');
        await expect.soft(dl.or(page.getByRole('heading').first())).toBeVisible({ timeout: 10000 });
        const ai = await aiAssertPage(page, `This should be a record details view for module "${m.name}", with labels and values or read-only fields.`);
        expect.soft(ai.passed).toBeTruthy();
      });
    }
  });
});