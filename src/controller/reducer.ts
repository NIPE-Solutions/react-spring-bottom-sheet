import type { SheetEvent, SheetState, TransitionResult } from './types.js'
import { reconcileActiveSnapPoint } from '../layout/reconcile-active-snap-point.js'

export function createInitialState(): SheetState {
  return {
    phase: 'closed',
    open: false,
    activeSnapPoint: null,
    position: 0,
    targetPosition: 0,
    velocity: 0,
    dismissReason: null,
  }
}

function invalid(state: SheetState, event: SheetEvent): TransitionResult {
  return {
    state,
    diagnostic: {
      code: 'invalid-transition',
      event: event.type,
      phase: state.phase,
    },
  }
}

export function reduceSheetState(
  state: SheetState,
  event: SheetEvent,
): TransitionResult {
  if (event.type === 'OPEN_REQUESTED') {
    return {
      state: {
        ...state,
        phase: 'opening',
        open: true,
        activeSnapPoint: event.snapPoint,
        targetPosition: event.targetPosition,
        velocity: 0,
        dismissReason: null,
      },
      diagnostic: null,
    }
  }

  if (event.type === 'CLOSE_REQUESTED' && state.phase !== 'closed') {
    return {
      state: {
        ...state,
        phase: 'closing',
        open: false,
        dismissReason: event.reason,
        velocity: event.velocity ?? 0,
      },
      diagnostic: null,
    }
  }

  if (
    event.type === 'DRAG_STARTED' &&
    ['open', 'opening', 'settling'].includes(state.phase)
  ) {
    return {
      state: {
        ...state,
        phase: 'dragging',
        position: event.position,
        velocity: 0,
      },
      diagnostic: null,
    }
  }

  if (event.type === 'DRAG_MOVED' && state.phase === 'dragging') {
    return {
      state: { ...state, position: event.position },
      diagnostic: null,
    }
  }

  if (event.type === 'DRAG_ENDED' && state.phase === 'dragging') {
    return {
      state: {
        ...state,
        phase: 'settling',
        position: event.position,
        targetPosition: event.targetPosition,
        velocity: event.velocity,
        activeSnapPoint: event.snapPoint,
      },
      diagnostic: null,
    }
  }

  if (event.type === 'LAYOUT_CHANGED') {
    if (state.phase === 'closed') {
      return {
        state: {
          ...state,
          position: event.layout.closedPosition,
          targetPosition: event.layout.closedPosition,
        },
        diagnostic: null,
      }
    }

    if (state.phase === 'closing') {
      return {
        state: {
          ...state,
          targetPosition: event.layout.closedPosition,
        },
        diagnostic: null,
      }
    }

    const snapPoint = reconcileActiveSnapPoint(
      state.activeSnapPoint,
      state.position,
      event.layout.snapPoints,
    )
    if (!snapPoint) return { state, diagnostic: null }

    return {
      state: {
        ...state,
        phase: state.phase === 'dragging' ? 'dragging' : 'settling',
        activeSnapPoint: snapPoint.id,
        targetPosition: snapPoint.position,
        velocity: state.phase === 'dragging' ? state.velocity : 0,
      },
      diagnostic: null,
    }
  }

  if (event.type === 'SETTLED' && state.phase === 'closing') {
    return {
      state: {
        ...createInitialState(),
        position: event.position,
        targetPosition: event.position,
        velocity: 0,
      },
      diagnostic: null,
    }
  }

  if (
    event.type === 'SETTLED' &&
    (state.phase === 'opening' || state.phase === 'settling')
  ) {
    return {
      state: {
        ...state,
        phase: 'open',
        position: event.position,
        targetPosition: event.position,
        velocity: 0,
      },
      diagnostic: null,
    }
  }

  return invalid(state, event)
}
