import type { MetadataRoute } from 'next'
import { docs } from '../content/docs'
import { recipes } from '../recipes/registry'

const base = 'https://react-spring-bottom-sheet.nipesolutions.com'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/accessibility/`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/impressum/`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy/`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/de/impressum/`, changeFrequency: 'yearly', priority: 0.3 },
    {
      url: `${base}/de/datenschutz/`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    { url: `${base}/examples/`, changeFrequency: 'monthly', priority: 0.8 },
    {
      url: `${base}/migration-from-react-spring-bottom-sheet/`,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    ...recipes.map(({ slug }) => ({
      url: `${base}/examples/${slug}/`,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    ...docs.map(({ slug }) => ({
      url: `${base}/docs/${slug}/`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
