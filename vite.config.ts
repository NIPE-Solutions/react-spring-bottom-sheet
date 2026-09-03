import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: (id) =>
        ['motion', 'react', 'react-dom'].some(
          (dependency) => id === dependency || id.startsWith(`${dependency}/`),
        ),
    },
    sourcemap: true,
  },
})
