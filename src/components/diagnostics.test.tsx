import { render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Sheet } from './Sheet.js'

describe('component diagnostics and cleanup', () => {
  it('warns when an open dialog has no accessible name', async () => {
    const warning = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)
    render(
      <Sheet.Root defaultOpen>
        <Sheet.Content />
      </Sheet.Root>,
    )

    await waitFor(() =>
      expect(warning).toHaveBeenCalledWith(
        'Sheet.Content requires Sheet.Title or an aria-label.',
      ),
    )
    warning.mockRestore()
  })

  it('warns when controlled and uncontrolled open props conflict', () => {
    const warning = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)
    render(
      <Sheet.Root open defaultOpen>
        <Sheet.Content aria-label="Filters" />
      </Sheet.Root>,
    )

    expect(warning).toHaveBeenCalledWith(
      'Sheet.Root cannot use both open and defaultOpen; open takes precedence.',
    )
    warning.mockRestore()
  })

  it('restores isolated content after a Strict Mode unmount', async () => {
    const { unmount } = render(
      <StrictMode>
        <div data-testid="background">Background</div>
        <Sheet.Root defaultOpen>
          <Sheet.Portal>
            <Sheet.Content aria-label="Filters" />
          </Sheet.Portal>
        </Sheet.Root>
      </StrictMode>,
    )

    const backgroundContainer = screen.getByTestId('background').parentElement
    await waitFor(() =>
      expect(backgroundContainer).toHaveAttribute('aria-hidden', 'true'),
    )
    unmount()
    expect(backgroundContainer).not.toHaveAttribute('aria-hidden')
  })
})
