import { test, expect } from '@playwright/test';

test.describe('Agent Tracker Web App', () => {
  test('homepage loads and shows header', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]: ${msg.text()}`);
    });

    // Listen for page errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR]: ${error.message}`);
    });

    // Listen for request failures
    page.on('requestfailed', request => {
      console.log(`[REQUEST FAILED]: ${request.url()} - ${request.failure()?.errorText}`);
    });

    await page.goto('/');

    // Check header is present
    await expect(page.locator('h1')).toContainText('Agent Tracker');
  });

  test('sessions load after hydration', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]: ${msg.text()}`);
    });

    // Listen for page errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR]: ${error.message}`);
    });

    // Listen for network requests to server functions
    page.on('request', request => {
      if (request.url().includes('_rpc') || request.url().includes('server')) {
        console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('_rpc') || response.url().includes('server')) {
        console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
      }
    });

    await page.goto('/');

    // Wait for loading to disappear (max 10 seconds)
    const loadingText = page.locator('text=Loading sessions...');

    // First check if loading appears
    const isLoading = await loadingText.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`Loading visible: ${isLoading}`);

    if (isLoading) {
      // Wait for it to go away
      try {
        await expect(loadingText).not.toBeVisible({ timeout: 10000 });
        console.log('Loading finished');
      } catch (e) {
        console.log('Loading never finished - taking screenshot');
        await page.screenshot({ path: 'test-results/loading-stuck.png' });
        throw e;
      }
    }

    // Check for either sessions or "No sessions found" message
    const hasSessions = await page.locator('[href*="/sessions/"]').count() > 0;
    const hasNoSessions = await page.locator('text=No sessions found').isVisible().catch(() => false);

    console.log(`Has sessions: ${hasSessions}, Has no sessions message: ${hasNoSessions}`);

    expect(hasSessions || hasNoSessions).toBe(true);
  });

  test('debug: check what loads', async ({ page }) => {
    const requests: string[] = [];
    const responses: { url: string; status: number }[] = [];
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    page.on('request', request => {
      requests.push(`${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      responses.push({ url: response.url(), status: response.status() });
    });

    await page.goto('/');

    // Wait a bit for everything to load
    await page.waitForTimeout(5000);

    console.log('\n=== REQUESTS ===');
    requests.forEach(r => console.log(r));

    console.log('\n=== FAILED RESPONSES (non-2xx) ===');
    responses.filter(r => r.status >= 400).forEach(r => console.log(`${r.status} ${r.url}`));

    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(m => console.log(m));

    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.log(e));

    // Take a screenshot
    await page.screenshot({ path: 'test-results/debug-screenshot.png', fullPage: true });

    // Always pass - this is just for debugging
    expect(true).toBe(true);
  });
});
