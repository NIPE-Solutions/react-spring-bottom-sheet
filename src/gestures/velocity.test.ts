import { describe, expect, it } from 'vitest'
import { calculateVelocity } from './velocity.js'

describe('calculateVelocity', () => {
  it('returns pixels per millisecond from recent samples', () => {
    expect(
      calculateVelocity([
        { position: 100, time: 0 },
        { position: 130, time: 50 },
        { position: 180, time: 100 },
      ]),
    ).toBe(0.8)
  })

  it('ignores samples outside the measurement window', () => {
    expect(
      calculateVelocity(
        [
          { position: 0, time: 0 },
          { position: 100, time: 100 },
          { position: 140, time: 140 },
        ],
        50,
      ),
    ).toBe(1)
  })

  it('preserves upward velocity as a negative value', () => {
    expect(
      calculateVelocity([
        { position: 300, time: 10 },
        { position: 240, time: 40 },
      ]),
    ).toBe(-2)
  })

  it('returns zero without two distinct timestamps', () => {
    expect(calculateVelocity([])).toBe(0)
    expect(calculateVelocity([{ position: 10, time: 5 }])).toBe(0)
    expect(
      calculateVelocity([
        { position: 10, time: 5 },
        { position: 20, time: 5 },
      ]),
    ).toBe(0)
  })
})
