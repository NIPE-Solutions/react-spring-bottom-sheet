import { useEffect } from 'react'
import type { SnapPoint } from '../public-types.js'
import { observeLayout } from '../layout/observe-layout.js'
import { resolveSnapPoints } from '../layout/resolve-snap-points.js'
import type { ResolvedLayout } from '../layout/types.js'

export interface UseSheetLayoutOptions {
  viewport: HTMLElement | null
  content: HTMLElement | null
  snapPoints: readonly SnapPoint[]
  onLayout(layout: ResolvedLayout): void
}

export function useSheetLayout({
  viewport,
  content,
  snapPoints,
  onLayout,
}: UseSheetLayoutOptions): void {
  useEffect(() => {
    if (!viewport || !content) return

    return observeLayout({
      viewport,
      content,
      onChange(measurements) {
        const resolved = resolveSnapPoints(snapPoints, measurements)
        if (resolved.snapPoints.length === 0) return
        onLayout({
          viewportHeight: measurements.viewportHeight,
          closedPosition:
            measurements.viewportHeight - measurements.safeAreaBottom,
          snapPoints: resolved.snapPoints,
        })
      },
    }).dispose
  }, [content, onLayout, snapPoints, viewport])
}
