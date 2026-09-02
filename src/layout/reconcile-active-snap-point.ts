import type { ResolvedSnapPoint } from './types.js'

export function reconcileActiveSnapPoint(
  activeId: string | null,
  previousPosition: number,
  snapPoints: readonly ResolvedSnapPoint[],
): ResolvedSnapPoint | null {
  if (snapPoints.length === 0) return null

  const active = snapPoints.find(({ id }) => id === activeId)
  if (active) return active

  let nearest = snapPoints[0]!
  let distance = Math.abs(previousPosition - nearest.position)

  for (let index = 1; index < snapPoints.length; index += 1) {
    const candidate = snapPoints[index]!
    const candidateDistance = Math.abs(previousPosition - candidate.position)
    if (candidateDistance < distance) {
      nearest = candidate
      distance = candidateDistance
    }
  }

  return nearest
}
