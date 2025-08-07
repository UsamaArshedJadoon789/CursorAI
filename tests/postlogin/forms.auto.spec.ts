import { test, expect } from '@playwright/test';
import { aiAssertPage } from '../../src/utils/aiAssert';

function safeSampleValue(type: string, name: string) {
  const lower = `${type} ${name}`.toLowerCase();
  if (/(email)/.test(lower)) return `playwright+auto@e2e.local`;
  if (/(phone|mobile|tel)/.test(lower)) return `0500000000`;
  if (/(date)/.test(lower)) return `2025-01-01`;
  if (/(name|user)/.test(lower)) return `Automated Tester`;
  if (/(id|رقم)/.test(lower)) return `12345`;
  if (/(amount|price|قيمة)/.test(lower)) return `100`;
  return `Test ${Date.now()}`;
}

async function fillForm(page) {
  const inputs = page.locator('form input, form select, form textarea');
  const count = await inputs.count();
  for (let i = 0; i < Math.min(count, 30); i++) {
    const el = inputs.nth(i);
    const type = (await el.getAttribute('type')) || '';
    const name = (await el.getAttribute('name')) || '';
    const disabled = await el.isDisabled();
    if (disabled) continue;
    if (/password|file|submit|checkbox|radio|hidden/i.test(type)) continue;
    try {
      await el.fill('');
      await el.fill(safeSampleValue(type, name));
    } catch {}
  }

  // Try selects
  const selects = page.locator('form select');
  const sCount = await selects.count();
  for (let i = 0; i < Math.min(sCount, 20); i++) {
    const s = selects.nth(i);
    const opts = await s.locator('option').all();
    if (opts.length > 1) {
      const val = (await opts[1].getAttribute('value')) || undefined;
      if (val) await s.selectOption(val);
    }
  }
}

test.describe('Post-login: Automatic form submission checks', () => {
  test('discover forms on pages and submit safely @forms', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const pagesToCheck = new Set<string>();
    pagesToCheck.add(page.url());

    const links = await page.locator('a[href*="create" i], a[href*="new" i], a[href*="form" i], a[href*="add" i]').all();
    for (const link of links.slice(0, 10)) {
      const href = await link.getAttribute('href');
      if (!href) continue;
      const abs = new URL(href, page.url()).toString();
      pagesToCheck.add(abs);
    }

    for (const url of pagesToCheck) {
      await test.step(`Check forms on ${url}`, async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const forms = page.locator('form');
        const fCount = await forms.count();
        if (fCount === 0) return;

        await fillForm(page);

        const submit = page.locator('form button[type="submit"], form input[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("إرسال"), button:has-text("حفظ")').first();
        if (await submit.isVisible()) {
          await Promise.all([
            page.waitForLoadState('domcontentloaded'),
            submit.click(),
          ]);

          const ai = await aiAssertPage(page, 'After submitting a typical form with safe sample data, the page should show either success feedback or validation messages explaining requirements.');
          test.info().annotations.push({ type: 'ai', description: `${url}: ${ai.reason}` });
          expect.soft(ai.passed).toBeTruthy();
        }
      });
    }
  });
});