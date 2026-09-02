import { describe, expect, it } from 'vitest'
import { selectSettleTarget } from './select-settle-target.js'

const points = [
  { id: 'full', position: 100 },
  { id: 'half', position: 400 },
  { id: 'peek', position: 650 },
]

describe('selectSettleTarget', () => {
  it('selects the nearest point at low velocity', () => {
    expect(
      selectSettleTarget({
        position: 430,
        velocity: 0.1,
        snapPoints: points,
        closedPosition: 800,
        dismissible: true,
      }),
    ).toEqual({ type: 'snap', snapPoint: points[1] })
  })

  it('advances one point in the direction of a flick', () => {
    expect(
      selectSettleTarget({
        position: 390,
        velocity: 0.8,
        snapPoints: points,
        closedPosition: 800,
        dismissible: false,
      }),
    ).toEqual({ type: 'snap', snapPoint: points[2] })

    expect(
      selectSettleTarget({
        position: 410,
        velocity: -0.8,
        snapPoints: points,
        closedPosition: 800,
        dismissible: false,
      }),
    ).toEqual({ type: 'snap', snapPoint: points[0] })
  })

  it('clamps movement beyond the first and last snap points', () => {
    expect(
      selectSettleTarget({
        position: -100,
        velocity: -1,
        snapPoints: points,
        closedPosition: 800,
        dismissible: false,
      }),
    ).toEqual({ type: 'snap', snapPoint: points[0] })

    expect(
      selectSettleTarget({
        position: 900,
        velocity: 1,
        snapPoints: points,
        closedPosition: 800,
        dismissible: false,
      }),
    ).toEqual({ type: 'snap', snapPoint: points[2] })
  })

  it('dismisses beyond the final midpoint or on a downward flick from it', () => {
    expect(
      selectSettleTarget({
        position: 730,
        velocity: 0.1,
        snapPoints: points,
        closedPosition: 800,
        dismissible: true,
      }),
    ).toEqual({ type: 'dismiss', position: 800 })

    expect(
      selectSettleTarget({
        position: 650,
        velocity: 0.8,
        snapPoints: points,
        closedPosition: 800,
        dismissible: true,
      }),
    ).toEqual({ type: 'dismiss', position: 800 })
  })

  it('returns no target when no snap points are available', () => {
    expect(
      selectSettleTarget({
        position: 400,
        velocity: 0,
        snapPoints: [],
        closedPosition: 800,
        dismissible: true,
      }),
    ).toEqual({ type: 'none' })
  })
})
