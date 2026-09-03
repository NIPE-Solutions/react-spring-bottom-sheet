import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  turbopack: {
    resolveAlias: {
      '@library': '../dist/index.js',
    },
  },
}

export default config
