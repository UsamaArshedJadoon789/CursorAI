import { test, expect } from '@playwright/test';
import { aiAssertPage } from '../../src/utils/aiAssert';

async function discoverMenuLinks(page) {
  const navRegions = page.locator('[role="navigation"], nav, aside');
  const links = navRegions.locator('a[href]:visible');
  const count = await links.count();
  const uniqueHrefs = new Set<string>();
  const items: { text: string; href: string }[] = [];

  for (let i = 0; i < Math.min(count, 100); i++) {
    const item = links.nth(i);
    const href = await item.getAttribute('href');
    const text = (await item.innerText()).trim();
    if (!href) continue;
    if (href.startsWith('javascript:') || href === '#' || href.toLowerCase().includes('logout')) continue;
    const absolute = new URL(href, page.url()).toString();
    if (!uniqueHrefs.has(absolute)) {
      uniqueHrefs.add(absolute);
      items.push({ text: text || href, href: absolute });
    }
  }
  return items;
}

test.describe('Post-login: Navigation discovery and page health', () => {
  test('open each discovered menu link and validate page structure @postlogin', async ({ page, context }) => {
    await page.goto('/');

    const menuItems = await discoverMenuLinks(page);
    test.info().annotations.push({ type: 'menu-count', description: `Discovered ${menuItems.length} menu items` });

    for (const { text, href } of menuItems) {
      await test.step(`Navigate: ${text} -> ${href}`, async () => {
        const [response] = await Promise.all([
          page.waitForLoadState('domcontentloaded'),
          page.goto(href),
        ]);

        // Basic health
        await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 });

        // AI semantic check
        const ai = await aiAssertPage(page, `The page should correspond to the menu label "${text}". It should contain relevant headings and content, not an error page.`);
        test.info().annotations.push({ type: 'ai', description: `${text}: ${ai.reason}` });
        expect.soft(ai.passed).toBeTruthy();
      });
    }
  });
});