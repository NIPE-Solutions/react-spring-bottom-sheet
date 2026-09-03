import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@library': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'website/content/**/*.{test,spec}.{ts,tsx}',
      'website/components/**/*.{test,spec}.{ts,tsx}',
      'website/recipes/**/*.{test,spec}.{ts,tsx}',
    ],
    setupFiles: ['./test/setup.ts'],
  },
})
