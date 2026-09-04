import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'React Spring Bottom Sheet',
    short_name: 'Bottom Sheet',
    description:
      'Accessible, composable bottom sheets for React with predictable gestures.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f6f8',
    theme_color: '#171a20',
    icons: [
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
