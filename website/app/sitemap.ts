import type { MetadataRoute } from 'next'
import { docs } from '../content/docs.mjs'

const base = 'https://react-spring-bottom-sheet.nipesolutions.com'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/examples/`, changeFrequency: 'monthly', priority: 0.8 },
    ...docs.map(({ slug }) => ({
      url: `${base}/docs/${slug}/`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
