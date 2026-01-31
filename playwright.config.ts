import { defineConfig, devices } from '@playwright/test';

/**
 * ArchiFlow E2E – Playwright config
 * הרצה: npm run test:e2e (headless) | npm run test:e2e:headed (דפדפן גלוי)
 * דרוש: npm run dev רץ ב־localhost:5173; לבדיקת לוח שנה – משתמש מחובר.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // אל תפעיל שרת מקומי כשמריצים מול Production (PLAYWRIGHT_BASE_URL)
  webServer:
    process.env.CI || process.env.PLAYWRIGHT_BASE_URL
      ? undefined
      : {
          command: 'npm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: true,
          timeout: 60_000,
        },
});
