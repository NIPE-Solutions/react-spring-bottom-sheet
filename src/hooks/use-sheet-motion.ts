import { useEffect } from 'react'
import type { SheetController, SheetState } from '../controller/types.js'
import type { MotionAdapter } from '../motion/types.js'

export interface UseSheetMotionOptions {
  controller: SheetController
  state: SheetState
  closedPosition: number
  reducedMotion: boolean
  adapter: MotionAdapter
  getPosition(): number
  onUpdate(position: number): void
  getBackdropProgress(): number
  onBackdropProgress(progress: number): void
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function resolveBackdropProgress(
  phase: SheetState['phase'],
  value: number,
  from: number,
  to: number,
  startProgress = phase === 'opening' ? 0 : 1,
): number {
  if (from === to) return phase === 'closing' ? 0 : 1
  const segmentProgress = clamp((value - from) / (to - from))
  const targetProgress = phase === 'closing' ? 0 : 1
  return clamp(
    startProgress + (targetProgress - startProgress) * segmentProgress,
  )
}

export function useSheetMotion({
  controller,
  state,
  closedPosition,
  reducedMotion,
  adapter,
  getPosition,
  onUpdate,
  getBackdropProgress,
  onBackdropProgress,
}: UseSheetMotionOptions): void {
  useEffect(() => {
    if (!['opening', 'settling', 'closing'].includes(state.phase)) return
    const from = getPosition()
    const target =
      state.phase === 'closing' ? closedPosition : state.targetPosition
    const startBackdropProgress = getBackdropProgress()
    const handle = adapter.start({
      from,
      to: target,
      velocity: state.velocity,
      reducedMotion,
      onUpdate(value) {
        onUpdate(value)
        onBackdropProgress(
          resolveBackdropProgress(
            state.phase,
            value,
            from,
            target,
            startBackdropProgress,
          ),
        )
      },
      onComplete: () =>
        controller.dispatch({ type: 'SETTLED', position: target }),
    })
    return () => handle.stop()
  }, [
    adapter,
    closedPosition,
    controller,
    getPosition,
    getBackdropProgress,
    onBackdropProgress,
    onUpdate,
    reducedMotion,
    state,
  ])
}
