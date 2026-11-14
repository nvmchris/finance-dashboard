/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_PORT = 5173;
// project-hub passes PORT/HOST; fall back to Vite's defaults for plain `npm run dev`.
const server = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  host: process.env.HOST || 'localhost',
  strictPort: Boolean(process.env.PORT),
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
