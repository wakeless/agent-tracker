import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  projects: [
    {
      name: 'integration',
      testMatch: /integration\.spec\.ts/,
      use: {
        baseURL: 'http://localhost:3000/agent-tracker/',
        trace: 'on-first-retry',
      },
    },
    {
      name: 'auth-enabled',
      testMatch: /auth\.spec\.ts/,
      use: {
        baseURL: 'http://localhost:3001/',
        trace: 'on-first-retry',
      },
    },
  ],
  webServer: [
    {
      command: 'BASE_PATH=/agent-tracker npm run dev',
      url: 'http://localhost:3000/agent-tracker',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'AUTH_CREDENTIAL=admin:testpass PORT=3001 npx tsx src/cli.ts',
      url: 'http://localhost:3001/',
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
