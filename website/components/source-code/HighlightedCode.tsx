import type { CSSProperties } from 'react'
import type { HighlightedLine } from './highlighter'

const FontStyle = {
  Italic: 1,
  Bold: 2,
  Underline: 4,
} as const

function tokenStyle(color: string, fontStyle = 0): CSSProperties {
  return {
    color,
    fontStyle: fontStyle & FontStyle.Italic ? 'italic' : undefined,
    fontWeight: fontStyle & FontStyle.Bold ? 700 : undefined,
    textDecoration: fontStyle & FontStyle.Underline ? 'underline' : undefined,
  }
}

export function HighlightedCode({
  filename,
  lines,
}: {
  filename: string
  lines: HighlightedLine[]
}) {
  const lineNumberWidth = `${String(lines.length).length}ch`

  return (
    <pre tabIndex={0} aria-label={`Source code for ${filename}`}>
      <code>
        {lines.map((line, lineIndex) => (
          <span key={lineIndex} style={{ display: 'block' }}>
            <span
              aria-hidden="true"
              style={{
                color: '#B9C0CF',
                display: 'inline-block',
                marginRight: '1.5rem',
                minWidth: lineNumberWidth,
                textAlign: 'right',
                userSelect: 'none',
              }}
            >
              {lineIndex + 1}
            </span>
            {line.map((token, tokenIndex) => (
              <span
                data-code-token=""
                key={`${lineIndex}:${tokenIndex}`}
                style={tokenStyle(token.color, token.fontStyle)}
              >
                {token.content}
              </span>
            ))}
          </span>
        ))}
      </code>
    </pre>
  )
}
