import type { ComponentType } from 'react'

export function RecipePreview({
  component: Component,
}: {
  component: ComponentType
}) {
  return (
    <section
      className="docs-recipe-preview"
      aria-labelledby="recipe-preview-title"
    >
      <div className="docs-recipe-section-heading">
        <p>Live package</p>
        <h2 id="recipe-preview-title">Preview</h2>
      </div>
      <div className="docs-recipe-stage">
        <Component />
      </div>
    </section>
  )
}
