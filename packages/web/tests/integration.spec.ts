import { test, expect, Page } from '@playwright/test';

/**
 * Integration tests for Agent Tracker Web App
 *
 * These tests verify the complete user flow through the application.
 * They test against the live dev server which connects to real session data.
 */

test.describe('Agent Tracker Web App - Integration Tests', () => {
  // Helper to collect console errors
  function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    return errors;
  }

  test.describe('Session List Page', () => {
    test('loads and displays session counts', async ({ page }) => {
      const errors = collectErrors(page);

      await page.goto('/');

      // Wait for loading to complete (count badges appear)
      await page.waitForFunction(
        () => document.body.textContent?.includes('Total'),
        { timeout: 15000 }
      );

      // Verify count badges are present (they display as "Total X")
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toContain('Total');
      expect(bodyText).toContain('Active');
      expect(bodyText).toContain('Inactive');
      expect(bodyText).toContain('Ended');

      // Check no JavaScript errors
      expect(errors).toHaveLength(0);
    });

    test('displays session cards or empty state', async ({ page }) => {
      await page.goto('/');

      // Wait for loading to complete - check for "Total" which appears after loading
      await page.waitForFunction(
        () => document.body.textContent?.includes('Total') ||
              document.body.textContent?.includes('No sessions found'),
        { timeout: 15000 }
      );

      // Should show either session cards or "No sessions found"
      const hasSessionCards = await page.locator('[href*="/sessions/"]').count();
      const hasEmptyState = await page.locator('body').textContent().then(t => t?.includes('No sessions found'));

      expect(hasSessionCards > 0 || hasEmptyState).toBe(true);
    });

    test('session cards contain required information', async ({ page }) => {
      await page.goto('/');

      // Wait for sessions to load
      await page.waitForTimeout(3000);

      const sessionCards = page.locator('[href*="/sessions/"]');
      const count = await sessionCards.count();

      if (count > 0) {
        // Check first session card has expected elements
        const firstCard = sessionCards.first();

        // Should have a status badge
        const statusBadge = firstCard.locator('span').filter({ hasText: /active|inactive|ended/i });
        await expect(statusBadge).toBeVisible();

        // Should have a working directory (code element)
        const cwdElement = firstCard.locator('code');
        await expect(cwdElement).toBeVisible();
      }
    });
  });

  test.describe('Session Detail Page', () => {
    test('navigates to session detail when clicking a session', async ({ page }) => {
      await page.goto('/');

      // Wait for sessions to load
      await page.waitForTimeout(3000);

      const sessionLinks = page.locator('[href*="/sessions/"]');
      const count = await sessionLinks.count();

      if (count > 0) {
        // Click the first session
        const firstSession = sessionLinks.first();
        const href = await firstSession.getAttribute('href');
        await firstSession.click();

        // Should navigate to the session detail page
        await expect(page).toHaveURL(new RegExp('/sessions/'));

        // Wait for the detail page to load
        await page.waitForTimeout(2000);
      }
    });

    test('session detail page displays correct information', async ({ page }) => {
      await page.goto('/');

      // Wait for sessions to load
      await page.waitForTimeout(3000);

      const sessionLinks = page.locator('[href*="/sessions/"]');
      const count = await sessionLinks.count();

      if (count > 0) {
        // Click the first session
        await sessionLinks.first().click();

        // Wait for detail page to load
        await page.waitForTimeout(2000);

        // Should show back link
        await expect(page.locator('text=Back to sessions')).toBeVisible();

        // Should show either session details or "Session not found"
        const hasDetails = await page.locator('text=Working Directory').isVisible().catch(() => false);
        const hasNotFound = await page.locator('text=Session not found').isVisible().catch(() => false);

        expect(hasDetails || hasNotFound).toBe(true);

        if (hasDetails) {
          // Verify detail cards are present
          await expect(page.locator('text=Working Directory')).toBeVisible();
          await expect(page.locator('text=Timestamps')).toBeVisible();
          await expect(page.locator('text=Transcript')).toBeVisible();
        }
      }
    });

    test('session detail has view transcript button', async ({ page }) => {
      await page.goto('/');

      await page.waitForTimeout(3000);

      const sessionLinks = page.locator('[href*="/sessions/"]');
      const count = await sessionLinks.count();

      if (count > 0) {
        await sessionLinks.first().click();
        await page.waitForTimeout(2000);

        const hasDetails = await page.locator('text=Working Directory').isVisible().catch(() => false);

        if (hasDetails) {
          // Should have "View Transcript" button
          await expect(page.locator('text=View Transcript')).toBeVisible();
        }
      }
    });
  });

  test.describe('Transcript Page', () => {
    test('navigates to transcript page and loads entries', async ({ page }) => {
      await page.goto('/');

      await page.waitForTimeout(3000);

      const sessionLinks = page.locator('[href*="/sessions/"]');
      const count = await sessionLinks.count();

      if (count > 0) {
        // Navigate to session detail
        await sessionLinks.first().click();
        await page.waitForTimeout(2000);

        const viewTranscriptBtn = page.locator('text=View Transcript');
        const hasButton = await viewTranscriptBtn.isVisible().catch(() => false);

        if (hasButton) {
          await viewTranscriptBtn.click();

          // Should navigate to transcript page
          await expect(page).toHaveURL(/\/transcript$/);

          // Wait for transcript to load
          await page.waitForTimeout(3000);

          // Should show either entries or "No transcript entries yet"
          const hasEntries = await page.locator('[id^="entry-"]').count() > 0;
          const hasEmptyState = await page.locator('text=No transcript entries yet').isVisible().catch(() => false);

          expect(hasEntries || hasEmptyState).toBe(true);
        }
      }
    });

    test('transcript page has keyboard navigation hints', async ({ page }) => {
      await page.goto('/');

      await page.waitForTimeout(3000);

      const sessionLinks = page.locator('[href*="/sessions/"]');
      const count = await sessionLinks.count();

      if (count > 0) {
        await sessionLinks.first().click();
        await page.waitForTimeout(2000);

        const viewTranscriptBtn = page.locator('text=View Transcript');
        const hasButton = await viewTranscriptBtn.isVisible().catch(() => false);

        if (hasButton) {
          await viewTranscriptBtn.click();
          await page.waitForTimeout(2000);

          // Should show keyboard navigation hints at the bottom
          await expect(page.locator('text=j/k: Navigate')).toBeVisible();
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('handles non-existent session gracefully', async ({ page }) => {
      // Use relative path (baseURL includes /agent-tracker)
      await page.goto('./sessions/non-existent-session-id');

      // Wait for page to load and react to render
      await page.waitForFunction(
        () => document.body.textContent?.includes('Session not found') ||
              document.body.textContent?.includes('Loading') === false,
        { timeout: 15000 }
      );

      // Should show "Session not found" message
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toContain('Session not found');
    });

    test('handles non-existent transcript gracefully', async ({ page }) => {
      // Use relative path (baseURL includes /agent-tracker)
      await page.goto('./sessions/non-existent-session-id/transcript');

      // Wait for page to load
      await page.waitForFunction(
        () => document.body.textContent?.includes('not found') ||
              document.body.textContent?.includes('No transcript') ||
              !document.body.textContent?.includes('Loading'),
        { timeout: 15000 }
      );

      // Should show either "Session not found" or "No transcript entries"
      const bodyText = await page.locator('body').textContent() || '';
      const hasAppropriateMessage =
        bodyText.includes('not found') ||
        bodyText.includes('No transcript');

      expect(hasAppropriateMessage).toBe(true);
    });
  });

  test.describe('Navigation', () => {
    test('back navigation works correctly', async ({ page }) => {
      await page.goto('/');

      await page.waitForTimeout(3000);

      const sessionLinks = page.locator('[href*="/sessions/"]');
      const count = await sessionLinks.count();

      if (count > 0) {
        // Navigate to session detail
        await sessionLinks.first().click();
        await page.waitForTimeout(2000);

        // Click back link
        const backLink = page.locator('text=Back to sessions');
        if (await backLink.isVisible()) {
          await backLink.click();

          // Should be back on the home page
          await expect(page).toHaveURL('/agent-tracker/');
        }
      }
    });
  });

  test.describe('Data Refresh', () => {
    test('sessions list refreshes periodically', async ({ page }) => {
      await page.goto('/');

      // Wait for initial load
      await page.waitForTimeout(3000);

      // Check that there are no errors after 10 seconds (2 poll cycles)
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.waitForTimeout(10000);

      // Should have no JavaScript errors from polling
      expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
    });
  });
});
