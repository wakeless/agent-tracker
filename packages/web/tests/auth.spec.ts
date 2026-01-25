import { test, expect } from '@playwright/test';

/**
 * Authentication tests for the Agent Tracker web dashboard.
 *
 * These tests verify HTTP Basic Auth functionality:
 * - 401 responses when auth is enabled but no credentials provided
 * - 401 responses for invalid credentials
 * - 200 responses for valid credentials
 * - 200 responses when auth is disabled (no-auth mode)
 */

test.describe('Authentication - Auth Enabled', () => {
  // These tests run against a server with auth enabled
  // The server is started with AUTH_CREDENTIAL=admin:testpass

  test('returns 401 without credentials', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(401);
    expect(response.headers()['www-authenticate']).toContain('Basic');
  });

  test('returns 401 with wrong credentials', async ({ request }) => {
    const response = await request.get('/', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from('wrong:creds').toString('base64')
      }
    });
    expect(response.status()).toBe(401);
  });

  test('returns 401 with wrong password', async ({ request }) => {
    const response = await request.get('/', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from('admin:wrongpass').toString('base64')
      }
    });
    expect(response.status()).toBe(401);
  });

  test('returns 200 with correct credentials', async ({ request }) => {
    const response = await request.get('/', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from('admin:testpass').toString('base64')
      }
    });
    expect(response.status()).toBe(200);
  });

  test('returns 401 with malformed Authorization header', async ({ request }) => {
    const response = await request.get('/', {
      headers: {
        'Authorization': 'Basic invalid-base64!!!'
      }
    });
    expect(response.status()).toBe(401);
  });

  test('returns 401 with Bearer token instead of Basic', async ({ request }) => {
    const response = await request.get('/', {
      headers: {
        'Authorization': 'Bearer sometoken'
      }
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Authentication - No Auth Mode', () => {
  // These tests run against a server with --no-auth flag
  // They are skipped by default and run in a separate project

  test.skip();  // Skip in default project; run in 'auth-disabled' project

  test('returns 200 without credentials in no-auth mode', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
  });
});
