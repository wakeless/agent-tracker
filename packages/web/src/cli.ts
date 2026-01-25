#!/usr/bin/env node
import { parseArgs } from 'node:util';
import {
  setServerConfig,
  generateRandomPassword,
  generateRandomUrlPath,
  parseCredential,
  type ServerConfig,
} from './config/auth-config';

// Parse command line arguments
const { values } = parseArgs({
  options: {
    credential: {
      type: 'string',
      short: 'c',
      default: process.env.AUTH_CREDENTIAL,
    },
    'no-auth': {
      type: 'boolean',
      default: false,
    },
    tls: {
      type: 'boolean',
      short: 't',
      default: false,
    },
    'tls-cert': {
      type: 'string',
      default: process.env.TLS_CERT,
    },
    'tls-key': {
      type: 'string',
      default: process.env.TLS_KEY,
    },
    'random-url': {
      type: 'boolean',
      short: 'r',
      default: false,
    },
    port: {
      type: 'string',
      short: 'p',
      default: process.env.PORT || '3000',
    },
    host: {
      type: 'string',
      short: 'h',
      default: process.env.HOST || 'localhost',
    },
    help: {
      type: 'boolean',
      default: false,
    },
  },
  allowPositionals: false,
});

// Show help
if (values.help) {
  console.log(`
Agent Tracker Web Dashboard

Usage: agent-tracker-web [options]

Options:
  -c, --credential <user:pass>  Set custom credentials (default: admin:<random>)
  --no-auth                     Disable authentication
  -t, --tls                     Enable TLS/HTTPS
  --tls-cert <path>             Path to TLS certificate file
  --tls-key <path>              Path to TLS private key file
  -r, --random-url              Add random path prefix for obscurity
  -p, --port <number>           Server port (default: 3000)
  -h, --host <hostname>         Server hostname (default: localhost)
  --help                        Show this help message

Environment Variables:
  AUTH_CREDENTIAL               Alternative to -c/--credential
  TLS_CERT                      Alternative to --tls-cert
  TLS_KEY                       Alternative to --tls-key
  PORT                          Alternative to -p/--port
  HOST                          Alternative to -h/--host

Examples:
  # Start with auto-generated password
  agent-tracker-web

  # Custom credentials
  agent-tracker-web -c admin:mysecretpassword

  # With TLS
  agent-tracker-web --tls --tls-cert ./cert.pem --tls-key ./key.pem

  # Disable authentication (not recommended)
  agent-tracker-web --no-auth

  # Random URL path for obscurity
  agent-tracker-web --random-url
`);
  process.exit(0);
}

// Build configuration
const authEnabled = !values['no-auth'];
let username = 'admin';
let password = generateRandomPassword();

if (values.credential) {
  const parsed = parseCredential(values.credential);
  if (!parsed) {
    console.error('Error: Invalid credential format. Use username:password');
    process.exit(1);
  }
  username = parsed.username;
  password = parsed.password;
}

const tlsEnabled = values.tls;
if (tlsEnabled) {
  if (!values['tls-cert'] || !values['tls-key']) {
    console.error('Error: TLS requires both --tls-cert and --tls-key');
    process.exit(1);
  }
}

const randomUrlPath = values['random-url'] ? generateRandomUrlPath() : undefined;
const port = parseInt(values.port!, 10);
const host = values.host!;

const config: ServerConfig = {
  auth: {
    enabled: authEnabled,
    username,
    password,
  },
  tls: {
    enabled: tlsEnabled,
    certPath: values['tls-cert'],
    keyPath: values['tls-key'],
  },
  port,
  host,
  randomUrlPath,
  basePath: randomUrlPath ? `/${randomUrlPath}` : (process.env.BASE_PATH || '/'),
};

// Set the global config
setServerConfig(config);

// Also set environment variables for Vite/TanStack Start
if (config.basePath !== '/') {
  process.env.BASE_PATH = config.basePath;
}
process.env.PORT = String(port);
process.env.HOST = host;

// Display startup banner
const protocol = tlsEnabled ? 'https' : 'http';
const baseUrl = `${protocol}://${host}:${port}${config.basePath}`;

console.log(`
============================================
  Agent Tracker Web Dashboard
============================================

`);

if (authEnabled) {
  console.log(`  Authentication: ENABLED
  Username: ${username}
  Password: ${password}
`);
} else {
  console.log(`  Authentication: DISABLED (not recommended)
`);
}

if (tlsEnabled) {
  console.log(`  TLS: ENABLED
  Certificate: ${values['tls-cert']}
  Key: ${values['tls-key']}
`);
}

console.log(`  URL: ${baseUrl}
`);

if (authEnabled) {
  // Show curl command with auth
  const base64Creds = Buffer.from(`${username}:${password}`).toString('base64');
  console.log(`  Test with:
  curl -H "Authorization: Basic ${base64Creds}" ${baseUrl}
`);
}

console.log('============================================\n');

// Start the server
async function startServer() {
  if (tlsEnabled) {
    // Use custom TLS wrapper
    const { startTlsServer } = await import('./server-wrapper.js');
    await startTlsServer(config);
  } else {
    // Import and use the TanStack Start server
    // The server is started by importing the output module
    // We need to dynamically import based on build vs dev mode
    try {
      // Production mode - use compiled output
      const serverPath = new URL('../.output/server/index.mjs', import.meta.url).href;
      await import(serverPath);
    } catch {
      // Development mode - start vite dev server
      console.log('Starting in development mode...');
      const { spawn } = await import('node:child_process');
      const vite = spawn('npx', ['vite'], {
        stdio: 'inherit',
        env: {
          ...process.env,
          BASE_PATH: config.basePath,
          PORT: String(port),
          HOST: host,
          TLS_ENABLED: String(config.tls.enabled),
          TLS_CERT: config.tls.certPath || '',
          TLS_KEY: config.tls.keyPath || '',
        },
      });
      vite.on('error', (err) => {
        console.error('Failed to start dev server:', err);
        process.exit(1);
      });
    }
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
