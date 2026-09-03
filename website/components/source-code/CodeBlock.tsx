import type { ReactElement } from 'react'
import { CopySourceButton } from './CopySourceButton'
import { CodeTokens } from './CodeTokens'
import { highlightCode, type CodeLanguage } from './highlighter'

export type CodeBlockProps = {
  source: string
  language: CodeLanguage
  filename?: string
  label?: string
  lineNumbers?: boolean
  copy?: boolean
  className?: string
}

function joinCodeBlockClasses(className?: string) {
  return ['docs-code-block', className].filter(Boolean).join(' ')
}

function CodeBlockHeader({
  filename,
  source,
  copy,
}: Pick<CodeBlockProps, 'filename' | 'source' | 'copy'>) {
  return (
    <div className="docs-code-block-header" data-code-block-header="">
      {filename ? <span>{filename}</span> : null}
      {copy ? <CopySourceButton source={source} /> : null}
    </div>
  )
}

export async function CodeBlock({
  source,
  language,
  filename,
  label,
  lineNumbers,
  copy,
  className,
}: CodeBlockProps): Promise<ReactElement> {
  const lines = await highlightCode(source, language)
  const accessibleLabel =
    label ?? (filename ? `${filename} source code` : `${language} code`)

  return (
    <section className={joinCodeBlockClasses(className)}>
      {filename || copy ? (
        <CodeBlockHeader filename={filename} source={source} copy={copy} />
      ) : null}
      <CodeTokens
        source={source}
        lines={lines}
        label={accessibleLabel}
        lineNumbers={lineNumbers ?? false}
      />
    </section>
  )
}
