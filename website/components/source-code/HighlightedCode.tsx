import { Fragment, type CSSProperties } from 'react'
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
  // Literal LF nodes preserve every line boundary. Chromium otherwise drops
  // the final LF when a selection ends on the empty trailing line; a hidden,
  // zero-size boundary keeps that byte selectable without adding a visual row.
  const hasTrailingNewline =
    lines.length > 1 &&
    lines.at(-1)?.every((token) => token.content.length === 0)

  return (
    <pre tabIndex={0} aria-label={`Source code for ${filename}`}>
      <code>
        {lines.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            <span data-line={lineIndex + 1} style={{ display: 'inline-block' }}>
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
              {hasTrailingNewline && lineIndex === lines.length - 1 ? (
                <img
                  alt=""
                  aria-hidden="true"
                  data-source-trailing-newline=""
                  style={{
                    display: 'block',
                    height: 0,
                    userSelect: 'none',
                    width: 0,
                  }}
                />
              ) : null}
            </span>
            {lineIndex < lines.length - 1 ? '\n' : null}
          </Fragment>
        ))}
      </code>
    </pre>
  )
}
