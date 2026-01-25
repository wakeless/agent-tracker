import { createMiddleware } from '@tanstack/react-start';
import { getServerConfig, validateBasicAuth } from '../config/auth-config';

/**
 * HTTP Basic Auth middleware for TanStack Start.
 * Returns 401 with WWW-Authenticate header if auth fails.
 */
export const basicAuthMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next, request }) => {
    const config = getServerConfig();

    // Skip auth check if authentication is disabled
    if (!config.auth.enabled) {
      return next();
    }

    const authHeader = request.headers.get('authorization');

    if (!validateBasicAuth(authHeader, config.auth)) {
      return new Response('Authentication Required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Agent Tracker"',
          'Content-Type': 'text/plain',
        },
      });
    }

    return next();
  }
);
