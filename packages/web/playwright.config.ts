import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000/agent-tracker',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'BASE_PATH=/agent-tracker npm run dev',
    url: 'http://localhost:3000/agent-tracker',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
