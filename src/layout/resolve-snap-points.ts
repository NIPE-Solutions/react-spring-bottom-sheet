import type { SnapPoint, SnapPointValue } from '../public-types.js'
import type {
  LayoutMeasurements,
  ResolvedSnapPoint,
  SnapPointDiagnostic,
} from './types.js'

export interface ResolveSnapPointsResult {
  snapPoints: ResolvedSnapPoint[]
  diagnostics: SnapPointDiagnostic[]
}

function validMeasurements(measurements: LayoutMeasurements): boolean {
  const values = [
    measurements.viewportHeight,
    measurements.contentHeight,
    measurements.safeAreaTop,
    measurements.safeAreaBottom,
  ]

  return (
    values.every((value) => Number.isFinite(value) && value >= 0) &&
    measurements.viewportHeight >
      measurements.safeAreaTop + measurements.safeAreaBottom
  )
}

function resolveHeight(
  value: SnapPointValue,
  measurements: LayoutMeasurements,
  availableHeight: number,
): number | null {
  if (value === 'content') return measurements.contentHeight
  if (typeof value === 'number') {
    return value > 0 && value <= 1 ? value * availableHeight : null
  }

  const match = /^(-?(?:\d+\.?\d*|\.\d+))(px|%)$/.exec(value)
  if (!match) return null

  const amount = Number(match[1])
  if (!Number.isFinite(amount) || amount <= 0) return null
  return match[2] === '%' ? (amount / 100) * availableHeight : amount
}

export function resolveSnapPoints(
  snapPoints: readonly SnapPoint[],
  measurements: LayoutMeasurements,
): ResolveSnapPointsResult {
  if (!validMeasurements(measurements)) {
    return {
      snapPoints: [],
      diagnostics: [{ code: 'invalid-measurements' }],
    }
  }

  const availableHeight =
    measurements.viewportHeight -
    measurements.safeAreaTop -
    measurements.safeAreaBottom
  const seen = new Set<string>()
  const resolved: ResolvedSnapPoint[] = []
  const diagnostics: SnapPointDiagnostic[] = []

  for (const snapPoint of snapPoints) {
    if (seen.has(snapPoint.id)) {
      diagnostics.push({ code: 'duplicate-id', id: snapPoint.id })
      continue
    }
    seen.add(snapPoint.id)

    const height = resolveHeight(snapPoint.value, measurements, availableHeight)
    if (height === null) {
      diagnostics.push({
        code: 'invalid-value',
        id: snapPoint.id,
        value: snapPoint.value,
      })
      continue
    }

    const clampedHeight = Math.min(height, availableHeight)
    resolved.push({
      id: snapPoint.id,
      position:
        measurements.viewportHeight -
        measurements.safeAreaBottom -
        clampedHeight,
    })
  }

  resolved.sort((left, right) => left.position - right.position)
  return { snapPoints: resolved, diagnostics }
}
