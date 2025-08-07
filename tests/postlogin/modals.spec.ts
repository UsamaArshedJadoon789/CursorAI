import { test, expect } from '@playwright/test';

test.describe('Post-login: Modals and dialogs', () => {
  test('open and close first visible modal trigger @modals', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const triggers = page.locator('[data-bs-toggle="modal"], [data-toggle="modal"], button:has-text("Open"), button:has-text("عرض")');
    if (await triggers.first().isVisible()) {
      await triggers.first().click();
      const dialog = page.getByRole('dialog').first();
      await expect(dialog).toBeVisible({ timeout: 10000 });

      const close = dialog.getByRole('button', { name: /close|اغلاق|إغلاق/i }).first().or(dialog.locator('[data-bs-dismiss="modal"], .btn-close').first());
      if (await close.isVisible()) {
        await close.click();
        await expect(dialog).toBeHidden({ timeout: 10000 });
      }
    }
  });
});