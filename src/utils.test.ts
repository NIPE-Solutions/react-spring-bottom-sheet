import { describe, expect, it } from 'vitest'
import { processSnapPoints } from './utils'

describe('processSnapPoints', () => {
  it('rounds, clamps, and deduplicates snap points', () => {
    expect(processSnapPoints([-20, 100.4, 100.49, 900], 500)).toEqual({
      snapPoints: [0, 100, 500],
      minSnap: 0,
      maxSnap: 500,
    })
  })

  it('rejects a NaN snap point', () => {
    expect(() => processSnapPoints([100, Number.NaN], 500)).toThrow(
      'Found a NaN'
    )
  })
})
