import { createInitialState, reduceSheetState } from './reducer.js'
import { assertSheetState } from './invariants.js'
import type {
  ControllerDiagnostic,
  SheetController,
  SheetEvent,
  SheetState,
} from './types.js'

export interface CreateSheetControllerOptions {
  initialState?: SheetState
  onDiagnostic?: (diagnostic: ControllerDiagnostic) => void
}

export function createSheetController(
  options: CreateSheetControllerOptions = {},
): SheetController {
  let state = options.initialState ?? createInitialState()
  const listeners = new Set<(state: SheetState) => void>()

  return {
    getState() {
      return state
    },
    dispatch(event: SheetEvent) {
      const previousState = state
      const result = reduceSheetState(previousState, event)

      if (result.diagnostic) {
        options.onDiagnostic?.(result.diagnostic)
        return
      }

      state = result.state
      if (process.env.NODE_ENV !== 'production') assertSheetState(state)
      if (state !== previousState) {
        const notificationState = state
        for (const listener of [...listeners]) listener(notificationState)
      }
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
