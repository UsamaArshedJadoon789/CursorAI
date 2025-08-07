import { Page, expect } from '@playwright/test';

export async function expectNoConsoleErrors(page: Page, run: () => Promise<void>) {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') errors.push(msg.text());
  };
  page.on('console', handler as any);
  try {
    await run();
  } finally {
    page.off('console', handler as any);
  }
  expect.soft(errors, `Console errors detected: \n${errors.join('\n')}`).toHaveLength(0);
}