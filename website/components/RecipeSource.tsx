import { CopySourceButton } from './source-code/CopySourceButton'
import { HighlightedCode } from './source-code/HighlightedCode'
import { highlightTsx } from './source-code/highlighter'

export type RecipeSourceProps = {
  filename: string
  source: string
}

export async function RecipeSource({ filename, source }: RecipeSourceProps) {
  const lines = await highlightTsx(source)

  return (
    <section
      className="docs-recipe-source"
      aria-labelledby="recipe-source-title"
    >
      <div className="docs-recipe-section-heading">
        <div>
          <p>Complete implementation</p>
          <h2 id="recipe-source-title">Source</h2>
        </div>
        <CopySourceButton source={source} />
      </div>
      <details>
        <summary>View {filename}</summary>
        <HighlightedCode filename={filename} lines={lines} />
      </details>
    </section>
  )
}
