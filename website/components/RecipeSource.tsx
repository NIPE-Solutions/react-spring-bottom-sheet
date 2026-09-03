import { CopySourceButton } from './source-code/CopySourceButton'
import { CodeTokens } from './source-code/CodeTokens'
import { highlightCode } from './source-code/highlighter'

export type RecipeSourceProps = {
  filename: string
  source: string
}

export async function RecipeSource({ filename, source }: RecipeSourceProps) {
  const lines = await highlightCode(source, 'tsx')

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
        <CodeTokens
          source={source}
          lines={lines}
          label={`Source code for ${filename}`}
          lineNumbers
        />
      </details>
    </section>
  )
}
