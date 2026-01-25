import { createStart } from '@tanstack/react-start';
import { basicAuthMiddleware } from './middleware/auth-middleware';

export const startInstance = createStart(() => ({
  requestMiddleware: [basicAuthMiddleware],
}));
