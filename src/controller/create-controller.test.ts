import { describe, expect, it, vi } from 'vitest'
import { createSheetController } from './create-controller.js'

describe('sheet controller', () => {
  it('notifies subscribers after applying an event', () => {
    const controller = createSheetController()
    const listener = vi.fn()
    controller.subscribe(listener)

    controller.dispatch({
      type: 'OPEN_REQUESTED',
      reason: 'trigger',
      snapPoint: 'half',
      targetPosition: 400,
    })

    expect(listener).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ phase: 'opening', open: true }),
    )
  })

  it('uses a subscriber snapshot when dispatch triggers re-entrant changes', () => {
    const controller = createSheetController()
    const calls: string[] = []

    controller.subscribe((state) => {
      calls.push(`first:${state.phase}`)
      if (state.phase === 'opening') {
        controller.dispatch({ type: 'SETTLED', position: 400 })
      }
    })
    controller.subscribe((state) => calls.push(`second:${state.phase}`))

    controller.dispatch({
      type: 'OPEN_REQUESTED',
      reason: 'imperative',
      snapPoint: 'half',
      targetPosition: 400,
    })

    expect(calls).toEqual([
      'first:opening',
      'first:open',
      'second:open',
      'second:opening',
    ])
  })

  it('stops notifying an unsubscribed listener', () => {
    const controller = createSheetController()
    const listener = vi.fn()
    const unsubscribe = controller.subscribe(listener)
    unsubscribe()
    unsubscribe()

    controller.dispatch({
      type: 'OPEN_REQUESTED',
      reason: 'imperative',
      snapPoint: 'half',
      targetPosition: 400,
    })

    expect(listener).not.toHaveBeenCalled()
  })

  it('reports invalid transitions without notifying state subscribers', () => {
    const diagnostic = vi.fn()
    const listener = vi.fn()
    const controller = createSheetController({ onDiagnostic: diagnostic })
    controller.subscribe(listener)

    controller.dispatch({ type: 'DRAG_MOVED', position: 100 })

    expect(listener).not.toHaveBeenCalled()
    expect(diagnostic).toHaveBeenCalledWith({
      code: 'invalid-transition',
      event: 'DRAG_MOVED',
      phase: 'closed',
    })
  })
})
