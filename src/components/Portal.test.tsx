import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Sheet } from './Sheet.js'

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
})
