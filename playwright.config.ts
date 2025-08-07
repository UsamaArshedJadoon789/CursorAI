import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.BASE_URL || 'https://qc.uapi.sa';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1366, height: 864 },
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    // Auth setup project to create storageState.json once per run
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Pre-login flows (run without auth)
    {
      name: 'prelogin-chromium',
      testMatch: /prelogin\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Post-login flows across browsers, depend on setup
    {
      name: 'chromium',
      testMatch: /postlogin\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'storageState.json' },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testMatch: /postlogin\/.*\.spec\.ts/,
      use: { ...devices['Desktop Firefox'], storageState: 'storageState.json' },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      testMatch: /postlogin\/.*\.spec\.ts/,
      use: { ...devices['Desktop Safari'], storageState: 'storageState.json' },
      dependencies: ['setup'],
    },
  ],
});