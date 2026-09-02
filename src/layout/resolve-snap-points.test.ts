import { describe, expect, it } from 'vitest'
import { resolveSnapPoints } from './resolve-snap-points.js'

const measurements = {
  viewportHeight: 800,
  contentHeight: 300,
  safeAreaTop: 20,
  safeAreaBottom: 10,
}

describe('resolveSnapPoints', () => {
  it('resolves fractions, percentages, pixels, and content height', () => {
    const result = resolveSnapPoints(
      [
        { id: 'fraction', value: 0.5 },
        { id: 'percent', value: '75%' },
        { id: 'pixels', value: '200px' },
        { id: 'content', value: 'content' },
      ],
      measurements,
    )

    expect(result.snapPoints).toEqual([
      { id: 'percent', position: 212.5 },
      { id: 'fraction', position: 405 },
      { id: 'content', position: 490 },
      { id: 'pixels', position: 590 },
    ])
    expect(result.diagnostics).toEqual([])
  })

  it('clamps heights to the safe viewport', () => {
    const result = resolveSnapPoints(
      [
        { id: 'too-tall', value: '1200px' },
        { id: 'too-short', value: '-20px' },
      ],
      measurements,
    )

    expect(result.snapPoints).toEqual([{ id: 'too-tall', position: 20 }])
    expect(result.diagnostics).toEqual([
      { code: 'invalid-value', id: 'too-short', value: '-20px' },
    ])
  })

  it('rejects invalid fractions and percentage syntax', () => {
    const result = resolveSnapPoints(
      [
        { id: 'zero', value: 0 },
        { id: 'over', value: 1.1 },
        { id: 'syntax', value: 'half' as never },
      ],
      measurements,
    )

    expect(result.snapPoints).toEqual([])
    expect(
      result.diagnostics.map((diagnostic) => ({
        code: diagnostic.code,
        id: 'id' in diagnostic ? diagnostic.id : undefined,
      })),
    ).toEqual([
      { code: 'invalid-value', id: 'zero' },
      { code: 'invalid-value', id: 'over' },
      { code: 'invalid-value', id: 'syntax' },
    ])
  })

  it('keeps the first point when IDs are duplicated', () => {
    const result = resolveSnapPoints(
      [
        { id: 'half', value: 0.5 },
        { id: 'half', value: 0.8 },
      ],
      measurements,
    )

    expect(result.snapPoints).toEqual([{ id: 'half', position: 405 }])
    expect(result.diagnostics).toEqual([{ code: 'duplicate-id', id: 'half' }])
  })

  it('reports unusable measurements instead of producing NaN positions', () => {
    const result = resolveSnapPoints([{ id: 'half', value: 0.5 }], {
      ...measurements,
      viewportHeight: Number.NaN,
    })

    expect(result.snapPoints).toEqual([])
    expect(result.diagnostics).toEqual([{ code: 'invalid-measurements' }])
  })
})
