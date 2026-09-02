import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Sheet } from './Sheet.js'

function ModalExample({ modal = true, onOpenChange = vi.fn() }) {
  return (
    <>
      <main data-testid="background">Background</main>
      <Sheet.Root modal={modal} onOpenChange={onOpenChange}>
        <Sheet.Trigger>Open sheet</Sheet.Trigger>
        <Sheet.Portal>
          <Sheet.Backdrop />
          <Sheet.Content>
            <Sheet.Title>Account</Sheet.Title>
            <button>First action</button>
            <button>Last action</button>
          </Sheet.Content>
        </Sheet.Portal>
      </Sheet.Root>
    </>
  )
}

describe('sheet accessibility', () => {
  it('moves focus into a modal sheet and restores it after Escape', async () => {
    const onOpenChange = vi.fn()
    render(<ModalExample onOpenChange={onOpenChange} />)
    const trigger = screen.getByRole('button', { name: 'Open sheet' })
    trigger.focus()
    fireEvent.click(trigger)

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'First action' }),
      ).toHaveFocus(),
    )
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'escape' })
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('wraps Tab focus within a modal sheet', async () => {
    render(<ModalExample />)
    fireEvent.click(screen.getByRole('button', { name: 'Open sheet' }))
    const first = await screen.findByRole('button', { name: 'First action' })
    const last = screen.getByRole('button', { name: 'Last action' })

    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(first).toHaveFocus()

    first.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })

  it('returns programmatic focus escapes to the modal sheet', async () => {
    render(<ModalExample />)
    const trigger = screen.getByRole('button', { name: 'Open sheet' })
    fireEvent.click(trigger)
    const first = await screen.findByRole('button', { name: 'First action' })

    trigger.focus()
    expect(first).toHaveFocus()
  })

  it('can disable passive dismissal through Escape and the backdrop', async () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet.Root defaultOpen dismissible={false} onOpenChange={onOpenChange}>
        <Sheet.Portal>
          <Sheet.Backdrop />
          <Sheet.Content aria-label="Locked sheet" />
        </Sheet.Portal>
      </Sheet.Root>,
    )

    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(document.querySelector('[data-rsbs-backdrop]')!)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('isolates background content while a modal sheet is open', async () => {
    render(<ModalExample />)
    fireEvent.click(screen.getByRole('button', { name: 'Open sheet' }))

    await waitFor(() =>
      expect(screen.getByTestId('background').parentElement).toHaveAttribute(
        'aria-hidden',
        'true',
      ),
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() =>
      expect(
        screen.getByTestId('background').parentElement,
      ).not.toHaveAttribute('aria-hidden'),
    )
  })

  it('does not trap focus or isolate content in non-modal mode', async () => {
    const onOpenChange = vi.fn()
    render(<ModalExample modal={false} onOpenChange={onOpenChange} />)
    const trigger = screen.getByRole('button', { name: 'Open sheet' })
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = await screen.findByRole('dialog')

    expect(dialog).not.toHaveAttribute('aria-modal')
    expect(screen.getByTestId('background').parentElement).not.toHaveAttribute(
      'aria-hidden',
    )
    expect(trigger).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'escape' })
  })
})
