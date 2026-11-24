/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_PORT = 5173;
// Host names the hub opens Saldo by (tailnet + DuckDNS). Vite's dev server rejects
// any other name; ALLOWED_HOSTS (comma-separated) replaces this list.
const DEFAULT_ALLOWED_HOSTS = ['.tail2970c8.ts.net', 'nvmchris.duckdns.org'];
const allowedHosts = process.env.ALLOWED_HOSTS
  ? process.env.ALLOWED_HOSTS.split(',')
      .map((h) => h.trim())
      .filter(Boolean)
  : DEFAULT_ALLOWED_HOSTS;
// project-hub passes PORT/HOST; fall back to Vite's defaults for plain `npm run dev`.
const server = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  host: process.env.HOST || 'localhost',
  strictPort: Boolean(process.env.PORT),
  allowedHosts,
};

// Relative base so the build works on GitHub Pages and locally.
export default defineConfig({
  base: './',
  plugins: [react()],
  server,
  preview: server,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
