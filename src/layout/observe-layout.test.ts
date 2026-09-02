import { describe, expect, it, vi } from 'vitest'
import { observeLayout } from './observe-layout.js'

describe('observeLayout', () => {
  it('reports viewport, content, and safe-area measurements', () => {
    const viewport = document.createElement('div')
    const content = document.createElement('div')
    document.body.append(viewport)
    Object.defineProperty(viewport, 'clientHeight', { value: 800 })
    Object.defineProperty(content, 'scrollHeight', { value: 460 })
    const onChange = vi.fn()

    const observation = observeLayout({
      viewport,
      content,
      onChange,
      getSafeArea: () => ({ top: 24, bottom: 16 }),
    })

    expect(onChange).toHaveBeenLastCalledWith({
      viewportHeight: 800,
      contentHeight: 460,
      safeAreaTop: 24,
      safeAreaBottom: 16,
    })
    observation.dispose()
    viewport.remove()
  })

  it('measures the content box without counting visual overflow', () => {
    const viewport = document.createElement('div')
    const content = document.createElement('div')
    Object.defineProperty(viewport, 'clientHeight', { value: 800 })
    Object.defineProperty(content, 'scrollHeight', { value: 1200 })
    content.getBoundingClientRect = () => ({ height: 360 }) as DOMRect
    const onChange = vi.fn()

    const observation = observeLayout({ viewport, content, onChange })

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ contentHeight: 360 }),
    )
    observation.dispose()
  })

  it('measures a custom portal against its containing viewport', () => {
    const portalContainer = document.createElement('section')
    const viewport = document.createElement('div')
    const content = document.createElement('div')
    portalContainer.append(viewport)
    Object.defineProperty(viewport, 'clientHeight', { value: 320 })
    Object.defineProperty(content, 'scrollHeight', { value: 180 })
    const onChange = vi.fn()

    const observation = observeLayout({
      viewport,
      content,
      onChange,
      visualViewport: {
        height: 900,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ viewportHeight: 320 }),
    )
    observation.dispose()
  })

  it('reacts to element and visual viewport changes and disposes listeners', () => {
    let resizeCallback: () => void = () => undefined
    const disconnect = vi.fn()
    const observe = vi.fn()
    const resizeObserver = {
      observe,
      disconnect,
    }
    const visualListeners = new Set<(event: Event) => void>()
    const visualViewport = {
      height: 700,
      addEventListener: vi.fn(
        (_type: string, listener: (event: Event) => void) =>
          visualListeners.add(listener),
      ),
      removeEventListener: vi.fn(
        (_type: string, listener: (event: Event) => void) =>
          visualListeners.delete(listener),
      ),
    }
    const viewport = document.createElement('div')
    const content = document.createElement('div')
    document.body.append(viewport)
    Object.defineProperty(content, 'scrollHeight', { value: 400 })
    const onChange = vi.fn()

    const observation = observeLayout({
      viewport,
      content,
      onChange,
      visualViewport,
      createResizeObserver: (callback) => {
        resizeCallback = callback
        return resizeObserver
      },
    })

    expect(observe).toHaveBeenCalledTimes(2)
    resizeCallback()
    for (const listener of visualListeners) listener(new Event('resize'))
    expect(onChange).toHaveBeenCalledTimes(3)

    observation.dispose()
    expect(disconnect).toHaveBeenCalledOnce()
    expect(visualViewport.removeEventListener).toHaveBeenCalledOnce()
    for (const listener of visualListeners) listener(new Event('resize'))
    expect(onChange).toHaveBeenCalledTimes(3)
    viewport.remove()
  })
})
