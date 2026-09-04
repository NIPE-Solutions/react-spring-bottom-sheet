import { afterEach, expect, test, vi } from 'vitest'

afterEach(() => {
  vi.doUnmock('shiki/core')
  vi.resetModules()
})

test('constructs one highlighter for multiple tokenization calls', async () => {
  vi.resetModules()
  const shikiCore =
    await vi.importActual<typeof import('shiki/core')>('shiki/core')
  const createHighlighter = vi.fn(shikiCore.createHighlighterCore)
  vi.doMock('shiki/core', () => ({
    ...shikiCore,
    createHighlighterCore: createHighlighter,
  }))
  const { highlightTsx } = await import('./highlighter')

  await highlightTsx('const first = true')
  await highlightTsx('const second = false')

  expect(createHighlighter).toHaveBeenCalledTimes(1)
})
