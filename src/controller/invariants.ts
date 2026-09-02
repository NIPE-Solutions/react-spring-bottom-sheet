import type { SheetState } from './types.js'

export function assertSheetState(state: SheetState): void {
  if (state.phase === 'closed' && state.open) {
    throw new Error('closed phase requires open to be false')
  }

  if (
    (state.phase === 'opening' ||
      state.phase === 'open' ||
      state.phase === 'dragging' ||
      state.phase === 'settling') &&
    !state.activeSnapPoint
  ) {
    throw new Error(`${state.phase} phase requires an active snap point`)
  }

  if (
    !Number.isFinite(state.position) ||
    !Number.isFinite(state.targetPosition)
  ) {
    throw new Error('sheet positions must be finite')
  }
}
