import type { LayoutMeasurements } from './types.js'

interface ResizeObserverLike {
  observe(target: Element): void
  disconnect(): void
}

interface VisualViewportLike {
  readonly height: number
  addEventListener(type: 'resize', listener: (event: Event) => void): void
  removeEventListener(type: 'resize', listener: (event: Event) => void): void
}

export interface LayoutObservationOptions {
  viewport: HTMLElement
  content: HTMLElement
  onChange(measurements: LayoutMeasurements): void
  getSafeArea?: () => { top: number; bottom: number }
  visualViewport?: VisualViewportLike | null
  createResizeObserver?: (callback: () => void) => ResizeObserverLike | null
}

export interface LayoutObservation {
  measure(): void
  dispose(): void
}

function readSafeArea(): { top: number; bottom: number } {
  if (typeof document === 'undefined') return { top: 0, bottom: 0 }

  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)'
  document.body.append(probe)
  const style = getComputedStyle(probe)
  const result = {
    top: Number.parseFloat(style.paddingTop) || 0,
    bottom: Number.parseFloat(style.paddingBottom) || 0,
  }
  probe.remove()
  return result
}

export function observeLayout({
  viewport,
  content,
  onChange,
  getSafeArea = readSafeArea,
  visualViewport = typeof window === 'undefined' ? null : window.visualViewport,
  createResizeObserver = (callback) =>
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(callback),
}: LayoutObservationOptions): LayoutObservation {
  let disposed = false

  const measure = () => {
    if (disposed) return
    const safeArea = getSafeArea()
    onChange({
      viewportHeight: visualViewport?.height ?? viewport.clientHeight,
      contentHeight: content.scrollHeight,
      safeAreaTop: safeArea.top,
      safeAreaBottom: safeArea.bottom,
    })
  }

  const resizeObserver = createResizeObserver(measure)
  resizeObserver?.observe(viewport)
  resizeObserver?.observe(content)
  visualViewport?.addEventListener('resize', measure)
  measure()

  return {
    measure,
    dispose() {
      if (disposed) return
      disposed = true
      resizeObserver?.disconnect()
      visualViewport?.removeEventListener('resize', measure)
    },
  }
}
