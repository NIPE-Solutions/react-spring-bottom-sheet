import type { ComponentType } from 'react'

export function RecipeEmbedPage({
  title,
  component: Component,
}: {
  title: string
  component: ComponentType
}) {
  return (
    <main
      id="content"
      className="docs-recipe-embed"
      aria-label={`${title} interactive preview`}
    >
      <Component />
    </main>
  )
}
