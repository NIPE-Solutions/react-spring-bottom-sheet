export function RecipePreview({
  slug,
  title,
}: {
  slug: string
  title: string
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
        <iframe
          className="docs-recipe-frame"
          src={`/examples/${slug}/embed/`}
          title={`${title} interactive preview`}
        />
      </div>
    </section>
  )
}
