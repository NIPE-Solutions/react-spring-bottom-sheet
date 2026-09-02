import { useEffect } from 'react'
import type { SheetController, SheetState } from '../controller/types.js'
import type { MotionAdapter } from '../motion/types.js'

export interface UseSheetMotionOptions {
  controller: SheetController
  state: SheetState
  closedPosition: number
  reducedMotion: boolean
  adapter: MotionAdapter
  onUpdate(position: number): void
}

export function useSheetMotion({
  controller,
  state,
  closedPosition,
  reducedMotion,
  adapter,
  onUpdate,
}: UseSheetMotionOptions): void {
  useEffect(() => {
    if (!['opening', 'settling', 'closing'].includes(state.phase)) return
    const target =
      state.phase === 'closing' ? closedPosition : state.targetPosition
    const handle = adapter.start({
      from: state.position,
      to: target,
      velocity: state.velocity,
      reducedMotion,
      onUpdate,
      onComplete: () =>
        controller.dispatch({ type: 'SETTLED', position: target }),
    })
    return () => handle.stop()
  }, [adapter, closedPosition, controller, onUpdate, reducedMotion, state])
}
