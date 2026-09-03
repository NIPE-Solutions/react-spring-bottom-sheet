import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import type { ComponentProps } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Sheet } from './Sheet.js'

function setDimension(
  element: HTMLElement | null,
  property: 'clientHeight' | 'scrollHeight',
  value: number,
) {
  if (element)
    Object.defineProperty(element, property, { configurable: true, value })
}

function AnimatedPortalSheet(
  props: Omit<ComponentProps<typeof Sheet.Root>, 'children' | 'snapPoints'>,
) {
  return (
    <Sheet.Root {...props} snapPoints={[{ id: 'half', value: '50%' }]}>
      <Sheet.Portal>
        <Sheet.Viewport
          ref={(element) => setDimension(element, 'clientHeight', 800)}
        >
          <Sheet.Content
            aria-label="Filters"
            ref={(element) => setDimension(element, 'scrollHeight', 400)}
          >
            <Sheet.Close>Close filters</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}

describe('Sheet.Portal', () => {
  it('mounts an open sheet in document.body', () => {
    const { container } = render(
      <Sheet.Root defaultOpen>
        <Sheet.Portal>
          <Sheet.Content aria-label="Filters" />
        </Sheet.Portal>
      </Sheet.Root>,
    )

    expect(container).toBeEmptyDOMElement()
    expect(screen.getByRole('dialog')).toHaveAttribute('data-rsbs-content', '')
    expect(screen.getByRole('dialog').parentElement).toBe(document.body)
  })

  it('supports a custom portal container', () => {
    const portalContainer = document.createElement('section')
    document.body.append(portalContainer)

    render(
      <Sheet.Root defaultOpen>
        <Sheet.Portal container={portalContainer}>
          <Sheet.Content aria-label="Filters" />
        </Sheet.Portal>
      </Sheet.Root>,
    )

    expect(portalContainer).toContainElement(screen.getByRole('dialog'))
    portalContainer.remove()
  })

  it('does not mount portal content while closed', () => {
    render(
      <Sheet.Root>
        <Sheet.Portal>
          <Sheet.Content aria-label="Filters" />
        </Sheet.Portal>
      </Sheet.Root>,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders safely when a DOM is unavailable', () => {
    expect(
      renderToString(
        <Sheet.Root defaultOpen>
          <Sheet.Portal>
            <Sheet.Content aria-label="Filters" />
          </Sheet.Portal>
        </Sheet.Root>,
      ),
    ).toBe('')
  })

  it('keeps portal content mounted until the closing motion finishes', async () => {
    render(<AnimatedPortalSheet defaultOpen />)

    await waitFor(() =>
      expect(document.querySelector('[data-rsbs-content]')).toHaveStyle({
        '--rsbs-position': '400px',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close filters' }))

    expect(document.querySelector('[data-rsbs-content]')).toHaveAttribute(
      'data-rsbs-state',
      'closing',
    )
    expect(document.querySelector('[data-rsbs-content]')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    await waitFor(
      () =>
        expect(
          document.querySelector('[data-rsbs-content]'),
        ).not.toBeInTheDocument(),
      { timeout: 2_000 },
    )
  })

  it('interrupts closing when controlled state reopens the sheet', async () => {
    function ReopeningSheet() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open again
          </button>
          <AnimatedPortalSheet open={open} onOpenChange={setOpen} />
        </>
      )
    }

    render(<ReopeningSheet />)
    await waitFor(() =>
      expect(document.querySelector('[data-rsbs-content]')).toHaveAttribute(
        'data-rsbs-state',
        'open',
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close filters' }))
    expect(document.querySelector('[data-rsbs-content]')).toHaveAttribute(
      'data-rsbs-state',
      'closing',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open again' }))

    expect(document.querySelector('[data-rsbs-content]')).toHaveAttribute(
      'data-rsbs-state',
      'opening',
    )
  })
})
