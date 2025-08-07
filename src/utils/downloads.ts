import { Page, expect, Download } from '@playwright/test';

export async function expectDownload(page: Page, trigger: () => Promise<void>) {
  const [ download ] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    trigger(),
  ]);
  const suggested = download.suggestedFilename();
  const path = await download.path();
  expect.soft(suggested).toBeTruthy();
  expect.soft(path).toBeTruthy();
  return { download, suggested };
}