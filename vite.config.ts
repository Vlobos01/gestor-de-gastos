import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// base relativo para que el build funcione tanto en local como en GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
});
