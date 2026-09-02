import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RecipePreview } from '../../../components/RecipePreview'
import { RecipeSource } from '../../../components/RecipeSource'
import { getRecipe, recipes } from '../../../recipes/registry'

export const dynamicParams = false

export function generateStaticParams() {
  return recipes.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const recipe = getRecipe((await params).slug)
  return recipe
    ? {
        title: `${recipe.title} example`,
        description: recipe.summary,
        alternates: { canonical: `/examples/${recipe.slug}/` },
      }
    : {}
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const recipe = getRecipe((await params).slug)
  if (!recipe) notFound()

  return (
    <main id="content" className="docs-page docs-recipe-page" tabIndex={-1}>
      <header>
        <p className="docs-route">examples / {recipe.slug}</p>
        <h1>{recipe.title}</h1>
        <p>{recipe.summary}</p>
        <Link href="/examples/">All recipes</Link>
      </header>
      <RecipePreview component={recipe.component} />
      <section
        className="docs-recipe-notes"
        aria-labelledby="recipe-notes-title"
      >
        <h2 id="recipe-notes-title">Accessibility notes</h2>
        <ul>
          {recipe.accessibility.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
      <RecipeSource source={recipe.source} />
      <nav className="docs-related-docs" aria-label="Related documentation">
        <p>Related documentation</p>
        {recipe.relatedDocs.map((slug) => (
          <Link key={slug} href={`/docs/${slug}/`}>
            {slug.replaceAll('-', ' ')}
          </Link>
        ))}
      </nav>
    </main>
  )
}
