import { Page } from '@playwright/test';

export type BlockedRequest = {
  url: string;
  method: string;
  reason: string;
};

export async function enableSafeMode(page: Page) {
  const blocked: BlockedRequest[] = [];
  const shouldBlock = (url: string, method: string) => {
    if (['DELETE', 'PUT', 'PATCH'].includes(method)) return 'Blocked unsafe method';
    if (method === 'POST' && /delete|remove|destroy|drop|erase|حذف/i.test(url)) return 'Blocked destructive POST path';
    return '';
  };

  await page.route('**/*', async (route) => {
    const request = route.request();
    const reason = shouldBlock(request.url(), request.method());
    if (reason && process.env.SAFE_MODE !== 'false') {
      blocked.push({ url: request.url(), method: request.method(), reason });
      return route.abort();
    }
    return route.continue();
  });

  return {
    getBlocked: () => [...blocked],
  };
}