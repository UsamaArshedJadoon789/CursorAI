import { Page, Locator } from '@playwright/test';

export type MenuItem = { name: string; href: string; locator: Locator };

export class AppShell {
  constructor(private readonly page: Page) {}

  sidebar(): Locator {
    return this.page.locator('aside, [data-testid="sidebar"], nav[aria-label*="side" i]');
  }

  moduleLinks(): Locator {
    return this.sidebar().locator('a[href]:visible');
  }

  async listModules(max: number = 100): Promise<MenuItem[]> {
    const links = this.moduleLinks();
    const count = await links.count();
    const unique = new Map<string, MenuItem>();

    for (let i = 0; i < Math.min(count, max); i++) {
      const el = links.nth(i);
      const href = (await el.getAttribute('href')) || '';
      if (!href || href === '#' || href.startsWith('javascript:')) continue;
      const name = (await el.innerText()).trim() || href;
      const abs = new URL(href, this.page.url()).toString();
      if (!/logout|signout|log\s*out|تسجيل\s*الخروج/i.test(name) && !unique.has(abs)) {
        unique.set(abs, { name, href: abs, locator: el });
      }
    }
    return Array.from(unique.values());
  }
}