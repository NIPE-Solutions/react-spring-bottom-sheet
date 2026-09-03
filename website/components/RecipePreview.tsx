import { DeviceLab, DeviceLabFallback } from './device-lab/DeviceLab'

type RecipePreviewProps = Readonly<{
  slug: string
  title: string
}>

export function RecipePreview({ slug, title }: RecipePreviewProps) {
  return (
    <section
      className="docs-recipe-preview"
      aria-labelledby="recipe-preview-title"
    >
      <div className="docs-recipe-section-heading">
        <p>Live package</p>
        <h2 id="recipe-preview-title">Preview</h2>
      </div>
      <DeviceLab slug={slug} title={title} />
    </section>
  )
}

export function RecipePreviewFallback({ slug, title }: RecipePreviewProps) {
  return (
    <section
      className="docs-recipe-preview"
      aria-labelledby="recipe-preview-title"
    >
      <div className="docs-recipe-section-heading">
        <p>Live package</p>
        <h2 id="recipe-preview-title">Preview</h2>
      </div>
      <DeviceLabFallback slug={slug} title={title} />
    </section>
  )
}
