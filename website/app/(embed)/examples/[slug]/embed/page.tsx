import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RecipeEmbedPage } from '../../../../../components/RecipeEmbedPage'
import { getRecipe, recipes } from '../../../../../recipes/registry'

type PageProps = {
  params: Promise<{ slug: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return recipes.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const recipe = getRecipe((await params).slug)

  return recipe
    ? {
        title: `${recipe.title} interactive preview`,
        description: recipe.summary,
        robots: { index: false, follow: false },
      }
    : { robots: { index: false, follow: false } }
}

export default async function EmbedPage({ params }: PageProps) {
  const recipe = getRecipe((await params).slug)
  if (!recipe) notFound()

  return <RecipeEmbedPage title={recipe.title} component={recipe.component} />
}
