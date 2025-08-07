import { Page } from '@playwright/test';

function sampleFor(name: string, type?: string): string {
  const key = `${name} ${type || ''}`.toLowerCase();
  if (/email/.test(key)) return 'qa+playwright@uapi.local';
  if (/(phone|mobile|tel|جوال|هاتف)/.test(key)) return '0500000000';
  if (/date/.test(key)) return '2025-01-01';
  if (/time/.test(key)) return '12:00';
  if (/(name|title|subject|اسم|عنوان)/.test(key)) return 'Automated Test Record';
  if (/(desc|notes|ملاحظات|وصف)/.test(key)) return 'Automated test description.';
  if (/(amount|price|qty|quantity|قيمة|سعر|كمية)/.test(key)) return '10';
  if (/(id|رقم)/.test(key)) return '12345';
  return 'Test';
}

export async function fillAdvancedForm(page: Page) {
  // Textual inputs
  const inputs = page.locator('form input:not([type="hidden"]):not([type="password"]):not([disabled]), form textarea:not([disabled])');
  const inputCount = await inputs.count();
  for (let i = 0; i < Math.min(inputCount, 40); i++) {
    const input = inputs.nth(i);
    const type = (await input.getAttribute('type')) || '';
    const name = (await input.getAttribute('name')) || '';
    try {
      if (/checkbox|radio|file|submit|button/i.test(type)) continue;
      await input.fill('');
      await input.fill(sampleFor(name, type));
    } catch {}
  }

  // Date pickers (common libs sometimes use input[type=text] + calendar)
  const dateInputs = page.locator('form input[type="date"], form input[placeholder*="date" i]');
  const dCount = await dateInputs.count();
  for (let i = 0; i < Math.min(dCount, 10); i++) {
    const d = dateInputs.nth(i);
    try { await d.fill('2025-01-01'); } catch {}
  }

  // Native selects
  const selects = page.locator('form select:not([disabled])');
  const sCount = await selects.count();
  for (let i = 0; i < Math.min(sCount, 20); i++) {
    const s = selects.nth(i);
    try {
      const options = await s.locator('option').all();
      if (options.length > 1) {
        const val = (await options[1].getAttribute('value')) || undefined;
        if (val) await s.selectOption(val);
      }
    } catch {}
  }

  // Custom combobox/select (ARIA)
  const combos = page.getByRole('combobox');
  const cCount = await combos.count();
  for (let i = 0; i < Math.min(cCount, 10); i++) {
    const c = combos.nth(i);
    try {
      await c.click();
      await page.keyboard.type('t');
      await page.keyboard.press('Enter');
    } catch {}
  }

  // Checkboxes & radios
  const checks = page.locator('form input[type="checkbox"]:not([disabled])');
  for (let i = 0; i < Math.min(await checks.count(), 5); i++) {
    try { await checks.nth(i).check({ force: true }); } catch {}
  }

  const radios = page.locator('form input[type="radio"]:not([disabled])');
  for (let i = 0; i < Math.min(await radios.count(), 5); i++) {
    try { await radios.nth(i).check({ force: true }); } catch {}
  }

  // Optional uploads
  if (process.env.ALLOW_UPLOADS === 'true') {
    const files = page.locator('form input[type="file"]');
    if (await files.count()) {
      try {
        await files.first().setInputFiles(['fixtures/sample.txt']);
      } catch {}
    }
  }
}

export async function submitFormIfPossible(page: Page) {
  const submit = page.locator('form button[type="submit"], form input[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("إرسال"), button:has-text("حفظ")').first();
  if (await submit.isVisible()) {
    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      submit.click(),
    ]);
  }
}