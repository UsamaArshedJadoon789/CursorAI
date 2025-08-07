import { test, expect } from '@playwright/test';
import { AppShell } from '../../src/pages/AppShell';
import { fillAdvancedForm, submitFormIfPossible } from '../../src/utils/forms';
import { aiAssertPage } from '../../src/utils/aiAssert';

const MAX_MODULES = Number(process.env.MAX_MODULES_PER_SUITE || 20);
const ALLOW_DESTRUCTIVE = process.env.ALLOW_DESTRUCTIVE === 'true';

async function openFirstRow(page) {
  const rowLink = page.locator('table tbody tr a:visible').first().or(page.locator('table tbody tr').first());
  if (await rowLink.isVisible()) {
    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      rowLink.click(),
    ]);
  }
}

async function tryCreate(page) {
  const add = page.getByRole('button', { name: /add|new|create|إضافة|جديد|إنشاء/i }).first().or(
    page.getByRole('link', { name: /add|new|create|إضافة|جديد|إنشاء/i }).first()
  );
  if (await add.isVisible()) {
    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      add.click(),
    ]);

    await fillAdvancedForm(page);

    if (ALLOW_DESTRUCTIVE) {
      await submitFormIfPossible(page);
      const ai = await aiAssertPage(page, 'After creating a record with valid data, a success message should appear or the page should navigate to a details/list view showing the new record.');
      expect.soft(ai.passed).toBeTruthy();
    } else {
      test.info().annotations.push({ type: 'info', description: 'Destructive actions disabled; create submit skipped' });
    }
  }
}

async function tryEdit(page) {
  const edit = page.getByRole('button', { name: /edit|تعديل/i }).first().or(page.getByRole('link', { name: /edit|تعديل/i }).first());
  if (await edit.isVisible()) {
    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      edit.click(),
    ]);

    await fillAdvancedForm(page);

    if (ALLOW_DESTRUCTIVE) {
      await submitFormIfPossible(page);
    }
  }
}

async function tryDelete(page) {
  if (!ALLOW_DESTRUCTIVE) return;
  const del = page.getByRole('button', { name: /delete|remove|حذف/i }).first().or(page.getByRole('link', { name: /delete|remove|حذف/i }).first());
  if (await del.isVisible()) {
    await Promise.all([
      page.waitForEvent('dialog').then(d => d.accept()).catch(() => {}),
      del.click(),
    ]);
    await page.waitForLoadState('domcontentloaded');
  }
}

test.describe('Post-login: Modules CRUD coverage @modules @crud', () => {
  test('exercise create, view, edit, delete across modules', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const shell = new AppShell(page);
    const modules = (await shell.listModules(200)).slice(0, MAX_MODULES);

    for (const m of modules) {
      await test.step(`CRUD in ${m.name}`, async () => {
        await page.goto(m.href, { waitUntil: 'domcontentloaded' });
        await tryCreate(page);
        await openFirstRow(page);
        await tryEdit(page);
        await tryDelete(page);
      });
    }
  });
});