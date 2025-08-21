import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.BASE_URL || 'https://qc.uapi.sa';
const username = process.env.UAPI_USERNAME || 'sedr';
const password = process.env.UAPI_PASSWORD || 'V@iolaptop123';
const storageStatePath = process.env.STORAGE_STATE_PATH || 'storageState.json';

async function withBrowser<T>(run: (browser: Browser) => Promise<T>): Promise<T> {
  const browser = await chromium.launch({ headless: true });
  try {
    return await run(browser);
  } finally {
    await browser.close();
  }
}

async function withContext<T>(browser: Browser, run: (context: BrowserContext) => Promise<T>): Promise<T> {
  const context = await browser.newContext();
  try {
    return await run(context);
  } finally {
    await context.close();
  }
}

async function login(page: Page): Promise<void> {
  const loginUrl = `${baseURL.replace(/\/$/, '')}/login`;
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

  const userLocators = [
    page.getByLabel(/user|email|اسم/i),
    page.getByPlaceholder(/user|email|اسم/i),
    page.locator('input[name*="user" i]'),
    page.locator('input[type="text"]'),
  ];
  const passLocators = [
    page.getByLabel(/pass|كلمة المرور/i),
    page.getByPlaceholder(/pass|كلمة المرور/i),
    page.locator('input[name*="pass" i]'),
    page.locator('input[type="password"]'),
  ];

  const filledUser = await fillFirstVisible(userLocators, username);
  if (!filledUser) throw new Error('Could not find a visible username/email field');

  const filledPass = await fillFirstVisible(passLocators, password);
  if (!filledPass) throw new Error('Could not find a visible password field');

  const clickedLogin = await clickFirstVisible([
    page.getByRole('button', { name: /login|sign in|log in|دخول|تسجيل الدخول/i }),
    page.locator('button[type="submit"]'),
    page.getByText(/login|sign in|log in|دخول|تسجيل الدخول/i, { exact: false }),
  ]);
  if (!clickedLogin) {
    await page.keyboard.press('Enter');
  }

  await page.waitForLoadState('domcontentloaded');

  if (/\/login(\b|$)/i.test(page.url())) {
    throw new Error('Still on the login page after submit; authentication likely failed');
  }
}

async function fillFirstVisible(locators: import('playwright').Locator[], value: string): Promise<boolean> {
  for (const locator of locators) {
    const count = await locator.count();
    for (let index = 0; index < count; index++) {
      const item = locator.nth(index);
      if (await item.isVisible()) {
        await item.fill('');
        await item.fill(value);
        return true;
      }
    }
  }
  return false;
}

async function clickFirstVisible(locators: import('playwright').Locator[]): Promise<boolean> {
  for (const locator of locators) {
    const count = await locator.count();
    for (let index = 0; index < count; index++) {
      const item = locator.nth(index);
      if (await item.isVisible()) {
        await item.click();
        return true;
      }
    }
  }
  return false;
}

async function main(): Promise<void> {
  if (!username || !password) {
    throw new Error('Missing UAPI_USERNAME or UAPI_PASSWORD environment variables');
  }

  await withBrowser(async (browser) => {
    await withContext(browser, async (context) => {
      const page = await context.newPage();
      await login(page);
      await context.storageState({ path: storageStatePath });
      // eslint-disable-next-line no-console
      console.log(`Saved storage state to ${storageStatePath}`);
    });
  });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});

