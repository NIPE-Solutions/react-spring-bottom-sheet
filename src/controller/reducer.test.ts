import { describe, expect, it } from 'vitest'
import { createInitialState, reduceSheetState } from './reducer.js'
import type { SheetEvent, SheetState } from './types.js'

function transition(state: SheetState, event: SheetEvent): SheetState {
  return reduceSheetState(state, event).state
}

describe('sheet controller reducer', () => {
  it('opens and settles at the requested snap point', () => {
    const closed = createInitialState()
    const opening = transition(closed, {
      type: 'OPEN_REQUESTED',
      reason: 'trigger',
      snapPoint: 'half',
      targetPosition: 400,
    })

    expect(opening).toMatchObject({
      phase: 'opening',
      open: true,
      activeSnapPoint: 'half',
      targetPosition: 400,
    })

    expect(
      transition(opening, { type: 'SETTLED', position: 400 }),
    ).toMatchObject({ phase: 'open', position: 400, targetPosition: 400 })
  })

  it('closes from every active interaction phase', () => {
    for (const phase of ['opening', 'open', 'dragging', 'settling'] as const) {
      const state: SheetState = {
        phase,
        open: true,
        activeSnapPoint: 'half',
        position: 400,
        targetPosition: 400,
        dismissReason: null,
      }

      expect(
        transition(state, { type: 'CLOSE_REQUESTED', reason: 'escape' }),
      ).toMatchObject({
        phase: 'closing',
        open: false,
        dismissReason: 'escape',
      })
    }
  })

  it('tracks a drag and settles to its selected destination', () => {
    const open: SheetState = {
      phase: 'open',
      open: true,
      activeSnapPoint: 'half',
      position: 400,
      targetPosition: 400,
      dismissReason: null,
    }

    const dragging = transition(open, { type: 'DRAG_STARTED', position: 400 })
    expect(
      transition(dragging, { type: 'DRAG_MOVED', position: 520 }),
    ).toMatchObject({ phase: 'dragging', position: 520 })

    expect(
      transition(dragging, {
        type: 'DRAG_ENDED',
        position: 520,
        velocity: 0.5,
        snapPoint: 'closed',
        targetPosition: 800,
      }),
    ).toMatchObject({
      phase: 'settling',
      activeSnapPoint: 'closed',
      position: 520,
      targetPosition: 800,
    })
  })

  it('ignores impossible events and reports a diagnostic', () => {
    const result = reduceSheetState(createInitialState(), {
      type: 'DRAG_MOVED',
      position: 200,
    })

    expect(result.state).toEqual(createInitialState())
    expect(result.diagnostic).toEqual({
      code: 'invalid-transition',
      event: 'DRAG_MOVED',
      phase: 'closed',
    })
  })

  it('finishes closing without retaining interaction state', () => {
    const closing: SheetState = {
      phase: 'closing',
      open: false,
      activeSnapPoint: 'half',
      position: 300,
      targetPosition: 800,
      dismissReason: 'backdrop',
    }

    expect(transition(closing, { type: 'SETTLED', position: 800 })).toEqual({
      ...createInitialState(),
      position: 800,
      targetPosition: 800,
    })
  })

  it('reconciles the active snap point after a layout change', () => {
    const open: SheetState = {
      phase: 'open',
      open: true,
      activeSnapPoint: 'removed',
      position: 430,
      targetPosition: 430,
      dismissReason: null,
    }

    expect(
      transition(open, {
        type: 'LAYOUT_CHANGED',
        layout: {
          viewportHeight: 900,
          closedPosition: 890,
          snapPoints: [
            { id: 'full', position: 100 },
            { id: 'half', position: 450 },
          ],
        },
      }),
    ).toMatchObject({
      phase: 'settling',
      activeSnapPoint: 'half',
      targetPosition: 450,
    })
  })
})
