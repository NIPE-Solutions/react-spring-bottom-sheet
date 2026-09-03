import { describe, expect, it } from 'vitest'
import { highlightTsx } from './highlighter'

function restoreSource(lines: Awaited<ReturnType<typeof highlightTsx>>) {
  return lines
    .map((line) => line.map((token) => token.content).join(''))
    .join('\n')
}

describe('highlightTsx', () => {
  it('preserves source text, whitespace, and line boundaries', async () => {
    const source = 'const label = "Sheet"\n  // note\n'

    const lines = await highlightTsx(source)

    expect(restoreSource(lines)).toBe(source)
    expect(lines).toHaveLength(3)
    expect(lines[1]?.[0]?.content).toMatch(/^ {2}/)
  })

  it('assigns distinct colors to TSX syntax categories', async () => {
    const lines = await highlightTsx('const label = "Sheet"\n// note')

    expect(
      new Set(lines.flat().map((token) => token.color)).size,
    ).toBeGreaterThan(2)
  })

  it('returns untrusted markup as inert token content', async () => {
    const source = '<button onClick={() => alert("unsafe")}>Copy</button>'

    const lines = await highlightTsx(source)

    expect(restoreSource(lines)).toBe(source)
  })

  it('returns deterministic tokens across calls', async () => {
    const source = 'type SheetProps = { open: boolean }'

    await expect(highlightTsx(source)).resolves.toEqual(
      await highlightTsx(source),
    )
  })
})
