import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const localChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = process.env.CHROME_PATH || (existsSync(localChrome) ? localChrome : '/usr/bin/google-chrome');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 35_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4178/kiln-atelier/',
    viewport: { width: 1440, height: 1000 },
    browserName: 'chromium',
    launchOptions: { executablePath: chrome },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    acceptDownloads: true,
  },
});
