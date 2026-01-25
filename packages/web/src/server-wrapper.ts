import * as https from 'node:https';
import * as http from 'node:http';
import * as fs from 'node:fs';
import type { ServerConfig } from './config/auth-config';

/**
 * Start the server with TLS support.
 * This wraps the TanStack Start/Nitro handler with an HTTPS server.
 */
export async function startTlsServer(config: ServerConfig): Promise<void> {
  if (!config.tls.enabled || !config.tls.certPath || !config.tls.keyPath) {
    throw new Error('TLS configuration is incomplete');
  }

  // Read TLS certificates
  const cert = fs.readFileSync(config.tls.certPath);
  const key = fs.readFileSync(config.tls.keyPath);

  // Import the Nitro handler from TanStack Start output
  // Nitro exports a 'handler' function that can be used with Node.js createServer
  const nitroModule = await import('../.output/server/index.mjs');

  // Nitro's default export or handler export can be used as a request listener
  const handler = nitroModule.handler || nitroModule.default || ((req: http.IncomingMessage, res: http.ServerResponse) => {
    // Fallback: proxy to the internal server
    res.writeHead(500);
    res.end('Server handler not found');
  });

  // Create HTTPS server with the Nitro handler
  const server = https.createServer({ cert, key }, handler);

  return new Promise((resolve, reject) => {
    server.listen(config.port, config.host, () => {
      console.log(`TLS server listening on https://${config.host}:${config.port}${config.basePath}`);
      resolve();
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      reject(err);
    });
  });
}
