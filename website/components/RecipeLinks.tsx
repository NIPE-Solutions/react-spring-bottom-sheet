import Link from 'next/link'
import { recipes } from '../recipes/registry'

const featuredRecipes = ['basic', 'controlled', 'snap-points']

export function RecipeLinks() {
  return (
    <section className="docs-home-recipes" aria-labelledby="home-recipes-title">
      <header>
        <p>Working patterns</p>
        <h2 id="home-recipes-title">Move from example to application.</h2>
      </header>
      <div>
        {featuredRecipes.map((slug) => {
          const recipe = recipes.find((candidate) => candidate.slug === slug)
          if (!recipe) return null

          return (
            <article key={recipe.slug}>
              <div>
                <h3>{recipe.title}</h3>
                <p>{recipe.summary}</p>
              </div>
              <Link href={`/examples/${recipe.slug}/`}>
                Explore {recipe.title.toLowerCase()}
              </Link>
            </article>
          )
        })}
      </div>
      <Link className="docs-home-recipes-all" href="/examples/">
        Browse every recipe
      </Link>
    </section>
  )
}
