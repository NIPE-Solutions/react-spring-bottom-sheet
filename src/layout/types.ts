export interface LayoutMeasurements {
  viewportHeight: number
  contentHeight: number
  safeAreaTop: number
  safeAreaBottom: number
}

export interface ResolvedSnapPoint {
  id: string
  position: number
}

export type SnapPointDiagnostic =
  | { code: 'invalid-measurements' }
  | { code: 'duplicate-id'; id: string }
  | { code: 'invalid-value'; id: string; value: unknown }

export interface ResolvedLayout {
  viewportHeight: number
  closedPosition: number
  snapPoints: readonly ResolvedSnapPoint[]
}
