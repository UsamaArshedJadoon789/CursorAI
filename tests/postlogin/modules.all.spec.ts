import { test, expect } from '@playwright/test';
import { AppShell } from '../../src/pages/AppShell';
import { aiAssertPage } from '../../src/utils/aiAssert';
import { runA11yScan } from '../../src/utils/a11y';
import { enableSafeMode } from '../../src/utils/safeMode';

async function basicModuleChecks(page) {
  // Heading or breadcrumb present
  const heading = page.getByRole('heading').first();
  await expect.soft(heading).toBeVisible({ timeout: 15000 });

  // Look for common module elements: table/grid, filters, primary actions
  const table = page.locator('table').first();
  const grid = page.locator('[class*="grid" i]').first();
  const filter = page.getByPlaceholder(/search|filter|بحث|تصفية/i).first();
  const primaryAction = page.getByRole('button', { name: /add|new|create|إضافة|جديد|إنشاء/i }).first();

  await expect.soft(table.or(grid)).toBeVisible({ timeout: 5000 });
  await expect.soft(filter).toBeVisible();
  await expect.soft(primaryAction).toBeVisible();
}

test.describe('Post-login: All modules discovery and validation @modules', () => {
  test('navigate every visible sidebar module and validate page', async ({ page }) => {
    const safe = await enableSafeMode(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const shell = new AppShell(page);
    const modules = await shell.listModules(150);
    test.info().annotations.push({ type: 'modules', description: `Discovered ${modules.length} modules` });

    for (const m of modules) {
      await test.step(`Module: ${m.name} -> ${m.href}`, async () => {
        await page.goto(m.href, { waitUntil: 'domcontentloaded' });
        await basicModuleChecks(page);

        const ai = await aiAssertPage(page, `This should be the module page for "${m.name}". Expect relevant headings, table/grid or content, filter/search, and primary actions.`);
        test.info().annotations.push({ type: 'ai', description: `${m.name}: ${ai.reason}` });
        expect.soft(ai.passed).toBeTruthy();

        await runA11yScan(page, { failOn: 'serious' });
      });
    }

    const blocked = safe.getBlocked();
    if (blocked.length) {
      test.info().annotations.push({ type: 'safe-mode', description: `Blocked ${blocked.length} potentially destructive requests` });
    }
  });
});