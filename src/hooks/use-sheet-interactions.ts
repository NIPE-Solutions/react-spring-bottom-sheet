import { useEffect, useMemo, useRef } from 'react'
import type { PointerEventHandler } from 'react'
import type { SheetController, SheetState } from '../controller/types.js'
import { createPointerSession } from '../gestures/pointer-session.js'
import { applyDragResistance } from '../gestures/resistance.js'
import {
  decideGestureOwner,
  findScrollableAncestor,
} from '../gestures/scroll-boundary.js'
import { selectSettleTarget } from '../layout/select-settle-target.js'
import type { ResolvedLayout } from '../layout/types.js'

export interface UseSheetInteractionsOptions {
  content: HTMLElement | null
  controller: SheetController
  state: SheetState
  layout: ResolvedLayout | null
  dismissible: boolean
  onDismiss(): void
  onSnapPointChange(id: string): void
  onPositionChange(position: number): void
}

export interface SheetInteractionHandlers {
  onPointerDown: PointerEventHandler<HTMLElement>
  onPointerMove: PointerEventHandler<HTMLElement>
  onPointerUp: PointerEventHandler<HTMLElement>
  onPointerCancel: PointerEventHandler<HTMLElement>
}

export function useSheetInteractions({
  content,
  controller,
  state,
  layout,
  dismissible,
  onDismiss,
  onSnapPointChange,
  onPositionChange,
}: UseSheetInteractionsOptions): SheetInteractionHandlers {
  const stateRef = useRef(state)
  const layoutRef = useRef(layout)
  const scrollElementRef = useRef<HTMLElement | null>(null)
  const startedOnHandleRef = useRef(false)
  const sheetOwnsGestureRef = useRef(false)
  const takeoverDeltaRef = useRef(0)
  const startPositionRef = useRef(0)
  const captureTargetRef = useRef<HTMLElement | null>(null)
  stateRef.current = state
  layoutRef.current = layout

  const session = useMemo(
    () =>
      createPointerSession({
        onStart() {
          startPositionRef.current = stateRef.current.position
          sheetOwnsGestureRef.current = startedOnHandleRef.current
          takeoverDeltaRef.current = 0
          if (
            sheetOwnsGestureRef.current &&
            ['open', 'opening', 'settling'].includes(stateRef.current.phase)
          ) {
            controller.dispatch({
              type: 'DRAG_STARTED',
              position: startPositionRef.current,
            })
          }
        },
        onMove(movement) {
          const activeLayout = layoutRef.current
          if (!activeLayout) return

          if (!sheetOwnsGestureRef.current) {
            const scrollElement = scrollElementRef.current
            const owner = decideGestureOwner({
              deltaY: movement.deltaSinceLastY,
              scrollTop: scrollElement?.scrollTop ?? 0,
              scrollHeight: scrollElement?.scrollHeight ?? 0,
              clientHeight: scrollElement?.clientHeight ?? 0,
              startedOnHandle: startedOnHandleRef.current,
            })
            if (owner === 'content') return
            if (
              !['open', 'opening', 'settling'].includes(stateRef.current.phase)
            )
              return
            sheetOwnsGestureRef.current = true
            if (captureTargetRef.current) {
              session.capture(captureTargetRef.current)
            }
            takeoverDeltaRef.current = movement.deltaY
            startPositionRef.current = stateRef.current.position
            controller.dispatch({
              type: 'DRAG_STARTED',
              position: startPositionRef.current,
            })
          }

          const minimum = activeLayout.snapPoints[0]?.position
          if (minimum === undefined) return
          const position = applyDragResistance(
            startPositionRef.current +
              movement.deltaY -
              takeoverDeltaRef.current,
            { min: minimum, max: activeLayout.closedPosition },
          )
          controller.dispatch({ type: 'DRAG_MOVED', position })
          onPositionChange(position)
        },
        onEnd(completion) {
          const activeLayout = layoutRef.current
          if (!sheetOwnsGestureRef.current || !activeLayout) return
          const current = stateRef.current
          const target = selectSettleTarget({
            position: current.position,
            velocity: completion.cancelled ? 0 : completion.velocityY,
            snapPoints: activeLayout.snapPoints,
            closedPosition: activeLayout.closedPosition,
            dismissible,
          })

          if (target.type === 'dismiss') {
            controller.dispatch({
              type: 'CLOSE_REQUESTED',
              reason: 'drag',
              velocity: completion.velocityY,
            })
            onDismiss()
          } else if (target.type === 'snap') {
            controller.dispatch({
              type: 'DRAG_ENDED',
              position: current.position,
              velocity: completion.velocityY,
              snapPoint: target.snapPoint.id,
              targetPosition: target.snapPoint.position,
            })
            onSnapPointChange(target.snapPoint.id)
          }
        },
      }),
    [controller, dismissible, onDismiss, onPositionChange, onSnapPointChange],
  )

  useEffect(() => {
    const cancel = () => session.cancel()
    window.addEventListener('blur', cancel)
    return () => {
      window.removeEventListener('blur', cancel)
      session.dispose()
    }
  }, [session])

  return {
    onPointerDown(event) {
      if (
        !content ||
        !layout ||
        !['open', 'opening', 'settling'].includes(state.phase)
      )
        return
      if (session.active) {
        session.cancel()
        return
      }
      const target = event.target instanceof HTMLElement ? event.target : null
      startedOnHandleRef.current = Boolean(
        target?.closest('[data-rsbs-handle]'),
      )
      scrollElementRef.current = startedOnHandleRef.current
        ? null
        : findScrollableAncestor(event.target, content)
      captureTargetRef.current = event.currentTarget
      session.start(
        event.nativeEvent,
        startedOnHandleRef.current ? event.currentTarget : undefined,
      )
    },
    onPointerMove(event) {
      session.move(event.nativeEvent)
      if (sheetOwnsGestureRef.current) event.preventDefault()
    },
    onPointerUp(event) {
      session.end(event.nativeEvent)
    },
    onPointerCancel() {
      session.cancel()
    },
  }
}
