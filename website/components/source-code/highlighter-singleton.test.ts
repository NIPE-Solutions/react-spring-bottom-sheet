import { afterEach, expect, test, vi } from 'vitest'

afterEach(() => {
  vi.doUnmock('shiki/core')
  vi.resetModules()
})

test('constructs one highlighter for tokenization across languages', async () => {
  vi.resetModules()
  const shikiCore =
    await vi.importActual<typeof import('shiki/core')>('shiki/core')
  const createHighlighter = vi.fn(shikiCore.createHighlighterCore)
  vi.doMock('shiki/core', () => ({
    ...shikiCore,
    createHighlighterCore: createHighlighter,
  }))
  const { highlightCode } = await import('./highlighter')

  await highlightCode('const first = true', 'tsx')
  await highlightCode('.sheet { color: red; }', 'css')
  await highlightCode('npm install vitest', 'shell')

  expect(createHighlighter).toHaveBeenCalledTimes(1)
})
