import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import * as fs from 'node:fs';

// TLS configuration from environment variables
const tlsEnabled = process.env.TLS_ENABLED === 'true';
const tlsCert = process.env.TLS_CERT;
const tlsKey = process.env.TLS_KEY;

// Read TLS certs if TLS is enabled and paths are provided
const httpsConfig = tlsEnabled && tlsCert && tlsKey
  ? {
      cert: fs.readFileSync(tlsCert),
      key: fs.readFileSync(tlsKey),
    }
  : undefined;

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    https: httpsConfig,
  },
  plugins: [
    tsConfigPaths({
      root: __dirname,
      ignoreConfigErrors: true,
    }),
    tanstackStart({
      basePath: process.env.BASE_PATH || '/',
    }),
    viteReact(),
  ],
});
