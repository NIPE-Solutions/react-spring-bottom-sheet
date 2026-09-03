import { describe, expect, it } from 'vitest'
import { applyDragResistance } from './resistance.js'

describe('applyDragResistance', () => {
  it('preserves positions inside the allowed range', () => {
    expect(applyDragResistance(400, { min: 100, max: 700 })).toBe(400)
  })

  it('resists movement above and below the allowed range', () => {
    expect(applyDragResistance(0, { min: 100, max: 700 })).toBe(65)
    expect(applyDragResistance(800, { min: 100, max: 700 })).toBe(735)
  })

  it('approaches the boundary more strongly as overdrag increases', () => {
    const small = 100 - applyDragResistance(80, { min: 100, max: 700 })
    const large = 100 - applyDragResistance(-100, { min: 100, max: 700 })
    expect(large).toBeGreaterThan(small)
    expect(large).toBeLessThan(200)
  })

  it('rejects an inverted range', () => {
    expect(() => applyDragResistance(100, { min: 700, max: 100 })).toThrow(
      'drag range minimum cannot exceed maximum',
    )
  })
})
