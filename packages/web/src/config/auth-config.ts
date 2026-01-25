import * as crypto from 'node:crypto';

export interface AuthConfig {
  enabled: boolean;
  username: string;
  password: string;
}

export interface TlsConfig {
  enabled: boolean;
  certPath?: string;
  keyPath?: string;
}

export interface ServerConfig {
  auth: AuthConfig;
  tls: TlsConfig;
  port: number;
  host: string;
  randomUrlPath?: string;
  basePath: string;
}

// Global config storage
let serverConfig: ServerConfig | null = null;

export function getServerConfig(): ServerConfig {
  if (!serverConfig) {
    // Return default config if not set
    return {
      auth: {
        enabled: true,
        username: 'admin',
        password: generateRandomPassword(),
      },
      tls: {
        enabled: false,
      },
      port: 3000,
      host: 'localhost',
      basePath: '/',
    };
  }
  return serverConfig;
}

export function setServerConfig(config: ServerConfig): void {
  serverConfig = config;
}

export function generateRandomPassword(length: number = 16): string {
  // Generate a URL-safe random password
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

export function generateRandomUrlPath(length: number = 8): string {
  // Generate a random URL path segment
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

export function parseCredential(credential: string): { username: string; password: string } | null {
  const colonIndex = credential.indexOf(':');
  if (colonIndex === -1) {
    return null;
  }
  return {
    username: credential.slice(0, colonIndex),
    password: credential.slice(colonIndex + 1),
  };
}

export function validateBasicAuth(authHeader: string | null, config: AuthConfig): boolean {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.slice('Basic '.length);
  let credentials: string;

  try {
    credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  } catch {
    return false;
  }

  const parsed = parseCredential(credentials);
  if (!parsed) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  // timingSafeEqual requires equal-length buffers, so we hash first
  const providedHash = crypto.createHash('sha256')
    .update(`${parsed.username}:${parsed.password}`)
    .digest();
  const expectedHash = crypto.createHash('sha256')
    .update(`${config.username}:${config.password}`)
    .digest();

  return crypto.timingSafeEqual(providedHash, expectedHash);
}
