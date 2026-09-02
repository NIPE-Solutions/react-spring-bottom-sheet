import type { ResolvedSnapPoint } from './types.js'

const FLICK_VELOCITY = 0.45

export interface SelectSettleTargetOptions {
  position: number
  velocity: number
  snapPoints: readonly ResolvedSnapPoint[]
  closedPosition: number
  dismissible: boolean
}

export type SettleTarget =
  | { type: 'snap'; snapPoint: ResolvedSnapPoint }
  | { type: 'dismiss'; position: number }
  | { type: 'none' }

function nearestIndex(
  position: number,
  snapPoints: readonly ResolvedSnapPoint[],
): number {
  let selected = 0
  let distance = Math.abs(position - snapPoints[0]!.position)

  for (let index = 1; index < snapPoints.length; index += 1) {
    const candidateDistance = Math.abs(position - snapPoints[index]!.position)
    if (candidateDistance < distance) {
      selected = index
      distance = candidateDistance
    }
  }
  return selected
}

export function selectSettleTarget({
  position,
  velocity,
  snapPoints,
  closedPosition,
  dismissible,
}: SelectSettleTargetOptions): SettleTarget {
  if (snapPoints.length === 0) return { type: 'none' }

  const lastIndex = snapPoints.length - 1
  const lastPoint = snapPoints[lastIndex]!
  const dismissalMidpoint = (lastPoint.position + closedPosition) / 2
  const nearest = nearestIndex(position, snapPoints)

  if (
    dismissible &&
    (position >= dismissalMidpoint ||
      (nearest === lastIndex && velocity >= FLICK_VELOCITY))
  ) {
    return { type: 'dismiss', position: closedPosition }
  }

  if (Math.abs(velocity) >= FLICK_VELOCITY) {
    const direction = velocity > 0 ? 1 : -1
    const directedIndex = Math.max(0, Math.min(lastIndex, nearest + direction))
    return { type: 'snap', snapPoint: snapPoints[directedIndex]! }
  }

  return { type: 'snap', snapPoint: snapPoints[nearest]! }
}
