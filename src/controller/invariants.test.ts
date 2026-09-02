import { describe, expect, it } from 'vitest'
import { assertSheetState } from './invariants.js'
import { createInitialState } from './reducer.js'

describe('assertSheetState', () => {
  it('accepts a valid state', () => {
    expect(() => assertSheetState(createInitialState())).not.toThrow()
  })

  it('rejects a closed state marked open', () => {
    expect(() =>
      assertSheetState({ ...createInitialState(), open: true }),
    ).toThrow('closed phase requires open to be false')
  })

  it('rejects an active state without a snap point', () => {
    expect(() =>
      assertSheetState({
        ...createInitialState(),
        phase: 'dragging',
        open: true,
      }),
    ).toThrow('dragging phase requires an active snap point')
  })

  it('rejects non-finite positions', () => {
    expect(() =>
      assertSheetState({ ...createInitialState(), position: Number.NaN }),
    ).toThrow('sheet positions must be finite')
  })
})
