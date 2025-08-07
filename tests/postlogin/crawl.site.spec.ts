import { test, expect } from '@playwright/test';
import { bfsCrawl } from '../../src/utils/crawl';
import { aiAssertPage } from '../../src/utils/aiAssert';
import { runA11yScan } from '../../src/utils/a11y';

const MAX_PAGES = Number(process.env.MAX_CRAWL_PAGES || 40);

test.describe('Post-login: Site crawl and health checks', () => {
  test('bfs crawl within site, validate each page, and run a11y @crawl', async ({ page }) => {
    const start = new URL('/', page.context()._options.baseURL || 'https://qc.uapi.sa').toString();
    const visited = await bfsCrawl(page, start, { maxPages: MAX_PAGES });

    for (const url of visited) {
      await test.step(`Validate ${url}`, async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 });

        const ai = await aiAssertPage(page, 'This page should render correctly without obvious errors, with meaningful content and headings; not an error or blank page.');
        test.info().annotations.push({ type: 'ai', description: `${url}: ${ai.reason}` });
        expect.soft(ai.passed).toBeTruthy();

        await runA11yScan(page, { failOn: 'serious' });
      });
    }
  });
});