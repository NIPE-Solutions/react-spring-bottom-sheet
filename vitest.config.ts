import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      'src/{accessibility,components,composition,context,controller,gestures,layout,motion}/**/*.{test,spec}.{ts,tsx}',
    ],
    setupFiles: ['./test/setup.ts'],
  },
})
