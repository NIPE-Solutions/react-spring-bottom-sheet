import { describe, expect, it } from 'vitest'
import {
  highlightCode,
  type CodeLanguage,
  type HighlightedLine,
} from './highlighter'

function restoreSource(lines: HighlightedLine[]) {
  return lines
    .map((line) => line.map((token) => token.content).join(''))
    .join('\n')
}

const samples = {
  tsx: 'const view = <Sheet.Content aria-label="Cart" />\n',
  css: '.cart-sheet { color: var(--brand); }\n',
  shell: 'npm install @nipe-solutions/react-spring-bottom-sheet\n',
} as const

function colorFor(lines: HighlightedLine[], content: string) {
  return lines.flat().find((token) => token.content === content)?.color
}

describe('highlightCode', () => {
  it.each(Object.entries(samples))(
    'preserves every byte and assigns rich semantic colors for %s',
    async (language, source) => {
      const lines = await highlightCode(source, language as CodeLanguage)

      expect(restoreSource(lines)).toBe(source)
      expect(
        new Set(lines.flat().map((token) => token.color)).size,
      ).toBeGreaterThan(3)
    },
  )

  it('preserves CRLF line endings including a terminal CRLF', async () => {
    const source = 'const first = true\r\nconst second = false\r\n'

    const lines = await highlightCode(source, 'tsx')

    expect(restoreSource(lines)).toBe(source)
  })

  it.each<CodeLanguage>(['tsx', 'css', 'shell'])(
    'preserves lone carriage returns for %s',
    async (language) => {
      for (const source of ['\r', 'first\rsecond\r']) {
        const lines = await highlightCode(source, language)

        expect(restoreSource(lines)).toBe(source)
      }
    },
  )

  it('distinguishes TSX tags from attributes', async () => {
    const lines = await highlightCode(samples.tsx, 'tsx')

    expect(colorFor(lines, 'Sheet.Content')).toBeDefined()
    expect(colorFor(lines, 'aria-label')).toBeDefined()
    expect(colorFor(lines, 'Sheet.Content')).not.toBe(
      colorFor(lines, 'aria-label'),
    )
  })

  it('distinguishes CSS properties from values', async () => {
    const lines = await highlightCode(samples.css, 'css')

    expect(colorFor(lines, 'color')).toBeDefined()
    expect(colorFor(lines, 'var')).toBeDefined()
    expect(colorFor(lines, 'color')).not.toBe(colorFor(lines, 'var'))
  })

  it('distinguishes shell commands from flags', async () => {
    const lines = await highlightCode(
      'npm install --save-dev vitest\n',
      'shell',
    )

    expect(colorFor(lines, 'npm')).toBeDefined()
    expect(colorFor(lines, '--save-dev')).toBeDefined()
    expect(colorFor(lines, 'npm')).not.toBe(colorFor(lines, '--save-dev'))
  })
})
