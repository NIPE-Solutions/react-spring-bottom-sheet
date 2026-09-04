import { CodeBlock } from './source-code/CodeBlock'
import { SourceInspector } from './source-code/SourceInspector'

export type RecipeSourceProps = {
  filename: string
  source: string
}

export async function RecipeSource({ filename, source }: RecipeSourceProps) {
  const code = await CodeBlock({
    source,
    language: 'tsx',
    filename,
    lineNumbers: true,
    copy: true,
  })

  return <SourceInspector filename={filename}>{code}</SourceInspector>
}
