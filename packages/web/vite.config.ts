import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  server: {
    port: 3000,
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
