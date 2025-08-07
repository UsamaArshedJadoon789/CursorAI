import { test, expect } from '@playwright/test';
import { AppShell } from '../../src/pages/AppShell';
import { expectDownload } from '../../src/utils/downloads';

const MAX_MODULES = Number(process.env.MAX_MODULES_PER_SUITE || 20);

async function tryExport(page) {
  const buttons = [
    page.getByRole('button', { name: /export|csv|excel|pdf|تحميل|تصدير/i }).first(),
    page.getByRole('link', { name: /export|csv|excel|pdf|تحميل|تصدير/i }).first(),
  ];
  for (const btn of buttons) {
    if (await btn.isVisible()) {
      const name = await btn.innerText();
      if (/print|طباعة/i.test(name)) continue; // handle separately
      await expectDownload(page, async () => { await btn.click(); });
      break;
    }
  }
}

async function tryPrint(page) {
  const printBtn = page.getByRole('button', { name: /print|طباعة/i }).first().or(page.getByRole('link', { name: /print|طباعة/i }).first());
  if (await printBtn.isVisible()) {
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      printBtn.click(),
    ]);
    if (popup) {
      await popup.waitForLoadState('domcontentloaded');
      await popup.close();
    }
  }
}

test.describe('Post-login: Modules export and print @modules @export', () => {
  test('trigger export/print where available', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const modules = (await new AppShell(page).listModules(200)).slice(0, MAX_MODULES);

    for (const m of modules) {
      await test.step(`Export/Print on ${m.name}`, async () => {
        await page.goto(m.href, { waitUntil: 'domcontentloaded' });
        await tryExport(page);
        await tryPrint(page);
      });
    }
  });
});