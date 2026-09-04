import { Suspense, type ReactNode } from 'react'
import { DeviceLab, DeviceLabFallback } from './device-lab/DeviceLab'

type RecipePreviewProps = Readonly<{
  slug: string
  title: string
  sourceAction: ReactNode
}>

export function RecipePreview({
  slug,
  sourceAction,
  title,
}: RecipePreviewProps) {
  return (
    <section
      className="docs-recipe-preview"
      aria-labelledby="recipe-preview-title"
    >
      <div className="docs-recipe-section-heading">
        <div>
          <p>Live package</p>
          <h2 id="recipe-preview-title">Preview</h2>
        </div>
        {sourceAction}
      </div>
      <Suspense fallback={<DeviceLabFallback slug={slug} title={title} />}>
        <DeviceLab slug={slug} title={title} />
      </Suspense>
    </section>
  )
}
