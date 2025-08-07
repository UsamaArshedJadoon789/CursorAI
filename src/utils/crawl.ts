import { Page } from '@playwright/test';

export type CrawlOptions = {
  maxPages?: number;
  sameOriginOnly?: boolean;
  excludePatterns?: RegExp[];
};

export async function discoverLinksOnPage(page: Page): Promise<string[]> {
  const anchors = page.locator('a[href]:visible');
  const count = await anchors.count();
  const hrefs: string[] = [];
  for (let i = 0; i < Math.min(count, 500); i++) {
    const a = anchors.nth(i);
    const href = await a.getAttribute('href');
    if (!href) continue;
    hrefs.push(href);
  }
  return hrefs;
}

export function normalizeAndFilterLinks(hrefs: string[], baseUrl: string, options?: CrawlOptions): string[] {
  const urlObj = new URL(baseUrl);
  const sameOriginOnly = options?.sameOriginOnly ?? true;
  const exclude = options?.excludePatterns ?? [
    /logout|signout|log\s*out|تسجيل\s*الخروج/i,
    /delete|remove|destroy|drop|erase|حذف/i,
    /javascript:/i,
    /^#/,
  ];

  const unique = new Set<string>();
  for (const href of hrefs) {
    try {
      const abs = new URL(href, baseUrl).toString();
      if (sameOriginOnly && new URL(abs).origin !== urlObj.origin) continue;
      if (exclude.some((r) => r.test(abs))) continue;
      unique.add(abs);
    } catch {
      // ignore
    }
  }
  return Array.from(unique);
}

export async function bfsCrawl(page: Page, startUrl: string, options?: CrawlOptions): Promise<string[]> {
  const visited = new Set<string>();
  const queue: string[] = [startUrl];
  const result: string[] = [];
  const maxPages = options?.maxPages ?? 60;

  while (queue.length && result.length < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    result.push(url);

    const hrefs = await discoverLinksOnPage(page);
    const next = normalizeAndFilterLinks(hrefs, url, options);
    for (const n of next) {
      if (!visited.has(n) && !queue.includes(n)) queue.push(n);
    }
  }

  return result;
}