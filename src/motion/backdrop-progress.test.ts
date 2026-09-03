import { describe, expect, it } from 'vitest'
import { resolveBackdropProgress } from '../hooks/use-sheet-motion.js'

describe('resolveBackdropProgress', () => {
  it('fades in while opening', () => {
    expect(resolveBackdropProgress('opening', 800, 800, 400)).toBe(0)
    expect(resolveBackdropProgress('opening', 600, 800, 400)).toBe(0.5)
    expect(resolveBackdropProgress('opening', 400, 800, 400)).toBe(1)
  })

  it('fades out while closing', () => {
    expect(resolveBackdropProgress('closing', 400, 400, 800)).toBe(1)
    expect(resolveBackdropProgress('closing', 600, 400, 800)).toBe(0.5)
    expect(resolveBackdropProgress('closing', 800, 400, 800)).toBe(0)
  })

  it('keeps the backdrop visible while settling between snap points', () => {
    expect(resolveBackdropProgress('settling', 500, 600, 400)).toBe(1)
  })

  it('clamps spring overshoot and resolves zero-distance motion', () => {
    expect(resolveBackdropProgress('opening', 350, 800, 400)).toBe(1)
    expect(resolveBackdropProgress('closing', 850, 400, 800)).toBe(0)
    expect(resolveBackdropProgress('opening', 400, 400, 400)).toBe(1)
    expect(resolveBackdropProgress('closing', 800, 800, 800)).toBe(0)
  })

  it('continues from the current opacity when motion reverses', () => {
    expect(resolveBackdropProgress('opening', 600, 600, 400, 0.5)).toBe(0.5)
    expect(resolveBackdropProgress('opening', 500, 600, 400, 0.5)).toBe(0.75)
    expect(resolveBackdropProgress('closing', 600, 600, 800, 0.5)).toBe(0.5)
    expect(resolveBackdropProgress('closing', 700, 600, 800, 0.5)).toBe(0.25)
  })
})
