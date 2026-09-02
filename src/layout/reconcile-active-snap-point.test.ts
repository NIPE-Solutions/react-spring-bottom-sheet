import { describe, expect, it } from 'vitest'
import { reconcileActiveSnapPoint } from './reconcile-active-snap-point.js'

describe('reconcileActiveSnapPoint', () => {
  it('preserves an active point and uses its new measured position', () => {
    expect(
      reconcileActiveSnapPoint('half', 400, [
        { id: 'full', position: 80 },
        { id: 'half', position: 360 },
      ]),
    ).toEqual({ id: 'half', position: 360 })
  })

  it('selects the point nearest the previous position when active ID disappears', () => {
    expect(
      reconcileActiveSnapPoint('content', 480, [
        { id: 'full', position: 100 },
        { id: 'half', position: 420 },
        { id: 'peek', position: 650 },
      ]),
    ).toEqual({ id: 'half', position: 420 })
  })

  it('selects the first point for equal distances', () => {
    expect(
      reconcileActiveSnapPoint('removed', 300, [
        { id: 'higher', position: 200 },
        { id: 'lower', position: 400 },
      ]),
    ).toEqual({ id: 'higher', position: 200 })
  })

  it('returns null when the new layout has no snap points', () => {
    expect(reconcileActiveSnapPoint('half', 400, [])).toBeNull()
  })
})
