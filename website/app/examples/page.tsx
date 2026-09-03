import type { Metadata } from 'next'
import Link from 'next/link'
import { recipes } from '../../recipes/registry'

export const metadata: Metadata = {
  title: 'Examples',
  description: 'Interactive version 5 bottom-sheet patterns.',
  alternates: { canonical: '/examples/' },
}

export default function ExamplesPage() {
  return (
    <main id="content" className="docs-page docs-examples-page" tabIndex={-1}>
      <header>
        <p className="docs-route">recipe library</p>
        <h1>Build from working patterns.</h1>
        <p>
          Every recipe runs against the public package API and includes the
          complete implementation, behavior notes, and related guidance.
        </p>
      </header>
      <div className="docs-recipe-grid">
        {recipes.map((recipe, index) => (
          <article key={recipe.slug}>
            <p className="docs-recipe-index">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h2>{recipe.title}</h2>
            <p>{recipe.summary}</p>
            <Link href={`/examples/${recipe.slug}/`}>
              Open {recipe.title.toLowerCase()} recipe
            </Link>
          </article>
        ))}
      </div>
    </main>
  )
}
