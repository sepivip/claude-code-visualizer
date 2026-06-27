/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base: works at the custom-domain root (cckeys.work/) AND the
  // project subpath (sepivip.github.io/claude-code-visualizer/), so the cutover
  // never breaks asset URLs. Safe here because the app uses hash routing.
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
});
