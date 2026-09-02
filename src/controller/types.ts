import type { OpenChangeReason } from '../public-types.js'
import type { ResolvedLayout } from '../layout/types.js'

export type TransitionPhase =
  'closed' | 'opening' | 'open' | 'dragging' | 'settling' | 'closing'

export interface SheetState {
  phase: TransitionPhase
  open: boolean
  activeSnapPoint: string | null
  position: number
  targetPosition: number
  dismissReason: OpenChangeReason | null
}

export type SheetEvent =
  | {
      type: 'OPEN_REQUESTED'
      reason: OpenChangeReason
      snapPoint: string
      targetPosition: number
    }
  | { type: 'CLOSE_REQUESTED'; reason: OpenChangeReason }
  | { type: 'DRAG_STARTED'; position: number }
  | { type: 'DRAG_MOVED'; position: number }
  | {
      type: 'DRAG_ENDED'
      position: number
      velocity: number
      snapPoint: string
      targetPosition: number
    }
  | { type: 'LAYOUT_CHANGED'; layout: ResolvedLayout }
  | { type: 'SETTLED'; position: number }

export interface ControllerDiagnostic {
  code: 'invalid-transition'
  event: SheetEvent['type']
  phase: TransitionPhase
}

export interface TransitionResult {
  state: SheetState
  diagnostic: ControllerDiagnostic | null
}

export interface SheetController {
  getState(): SheetState
  dispatch(event: SheetEvent): void
  subscribe(listener: (state: SheetState) => void): () => void
}
