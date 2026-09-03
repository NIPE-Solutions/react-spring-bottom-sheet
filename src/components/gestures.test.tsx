import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Sheet } from './Sheet.js'

function setDimension(
  element: HTMLElement | null,
  name: string,
  value: number,
) {
  if (element)
    Object.defineProperty(element, name, { configurable: true, value })
}

function GestureExample({ children }: { children?: ReactNode }) {
  return (
    <Sheet.Root defaultOpen snapPoints={[{ id: 'half', value: 0.5 }]}>
      <Sheet.Viewport
        ref={(element) => setDimension(element, 'clientHeight', 800)}
      >
        <Sheet.Content
          aria-label="Test sheet"
          ref={(element) => setDimension(element, 'scrollHeight', 400)}
        >
          <Sheet.Handle>Drag</Sheet.Handle>
          {children}
        </Sheet.Content>
      </Sheet.Viewport>
    </Sheet.Root>
  )
}

describe('sheet gestures', () => {
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }))
  })

  afterEach(() => vi.restoreAllMocks())

  it('drags from the handle and exposes the interaction state', async () => {
    render(<GestureExample />)
    const content = screen.getByRole('dialog')
    const handle = screen.getByText('Drag')
    await waitFor(() =>
      expect(content.style.getPropertyValue('--rsbs-position')).toBe('400px'),
    )

    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 400 })
    fireEvent.pointerMove(content, { pointerId: 1, clientY: 500 })

    expect(content).toHaveAttribute('data-rsbs-dragging', 'true')
    expect(content.style.getPropertyValue('--rsbs-position')).toBe('500px')

    fireEvent.pointerUp(content, { pointerId: 1, clientY: 500 })
    await waitFor(() =>
      expect(content).not.toHaveAttribute('data-rsbs-dragging'),
    )
  })

  it('does not move the sheet while nested content owns the gesture', async () => {
    const scrollingRef = (element: HTMLDivElement | null) => {
      setDimension(element, 'clientHeight', 100)
      setDimension(element, 'scrollHeight', 300)
      if (element) element.scrollTop = 50
    }
    render(
      <GestureExample>
        <div ref={scrollingRef} style={{ overflowY: 'auto' }}>
          <button>Scrollable action</button>
        </div>
      </GestureExample>,
    )
    const content = screen.getByRole('dialog')
    const action = screen.getByRole('button', { name: 'Scrollable action' })
    await waitFor(() =>
      expect(content.style.getPropertyValue('--rsbs-position')).toBe('400px'),
    )

    fireEvent.pointerDown(action, { pointerId: 2, clientY: 300 })
    fireEvent.pointerMove(content, { pointerId: 2, clientY: 350 })

    expect(content).not.toHaveAttribute('data-rsbs-dragging')
    expect(content.style.getPropertyValue('--rsbs-position')).toBe('400px')
  })

  it('cancels an active drag on window blur', async () => {
    render(<GestureExample />)
    const content = screen.getByRole('dialog')
    await waitFor(() =>
      expect(content.style.getPropertyValue('--rsbs-position')).toBe('400px'),
    )

    fireEvent.pointerDown(screen.getByText('Drag'), {
      pointerId: 3,
      clientY: 400,
    })
    fireEvent.pointerMove(content, { pointerId: 3, clientY: 450 })
    expect(content).toHaveAttribute('data-rsbs-dragging', 'true')

    fireEvent.blur(window)
    await waitFor(() =>
      expect(content).not.toHaveAttribute('data-rsbs-dragging'),
    )
    expect(content.style.getPropertyValue('--rsbs-position')).toBe('400px')
  })

  it('moves to a controlled snap-point override', async () => {
    const snapPoints = [
      { id: 'half', value: 0.5 as const },
      { id: 'full', value: 0.9 as const },
    ]
    const { rerender } = render(
      <Sheet.Root defaultOpen activeSnapPoint="half" snapPoints={snapPoints}>
        <Sheet.Viewport
          ref={(element) => setDimension(element, 'clientHeight', 800)}
        >
          <Sheet.Content
            aria-label="Controlled sheet"
            ref={(element) => setDimension(element, 'scrollHeight', 720)}
          />
        </Sheet.Viewport>
      </Sheet.Root>,
    )
    const content = screen.getByRole('dialog')
    await waitFor(() =>
      expect(content.style.getPropertyValue('--rsbs-position')).toBe('400px'),
    )

    rerender(
      <Sheet.Root defaultOpen activeSnapPoint="full" snapPoints={snapPoints}>
        <Sheet.Viewport
          ref={(element) => setDimension(element, 'clientHeight', 800)}
        >
          <Sheet.Content
            aria-label="Controlled sheet"
            ref={(element) => setDimension(element, 'scrollHeight', 720)}
          />
        </Sheet.Viewport>
      </Sheet.Root>,
    )

    await waitFor(() =>
      expect(content.style.getPropertyValue('--rsbs-position')).toBe('80px'),
    )
  })
})
