import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Sheet } from './Sheet.js'

function Example({
  defaultOpen = false,
  onOpenChange,
}: {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: { reason: string }) => void
}) {
  return (
    <Sheet.Root defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <Sheet.Trigger>Open filters</Sheet.Trigger>
      <Sheet.Content>
        <Sheet.Title>Filters</Sheet.Title>
        <Sheet.Description>Refine the results</Sheet.Description>
        <Sheet.Close>Apply</Sheet.Close>
      </Sheet.Content>
    </Sheet.Root>
  )
}

describe('Sheet', () => {
  it('opens and closes in uncontrolled mode with structured reasons', () => {
    const onOpenChange = vi.fn()
    render(<Example onOpenChange={onOpenChange} />)

    expect(screen.getByRole('dialog')).toHaveAttribute(
      'data-rsbs-state',
      'closed',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open filters' }))
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'data-rsbs-state',
      'open',
    )
    expect(onOpenChange).toHaveBeenLastCalledWith(true, { reason: 'trigger' })

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'data-rsbs-state',
      'closed',
    )
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'close' })
  })

  it('requests a controlled change without mutating controlled state', () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet.Root open={false} onOpenChange={onOpenChange}>
        <Sheet.Trigger>Open</Sheet.Trigger>
        <Sheet.Content aria-label="Filters" />
      </Sheet.Root>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))

    expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'trigger' })
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'data-rsbs-state',
      'closed',
    )
  })

  it('supports a controlled owner updating the open prop', () => {
    function Controlled() {
      const [open, setOpen] = useState(false)
      return (
        <Sheet.Root open={open} onOpenChange={setOpen}>
          <Sheet.Trigger>Open</Sheet.Trigger>
          <Sheet.Content aria-label="Filters" />
        </Sheet.Root>
      )
    }

    render(<Controlled />)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'data-rsbs-state',
      'open',
    )
  })

  it('connects title and description to the dialog', () => {
    render(<Example defaultOpen />)
    const dialog = screen.getByRole('dialog', {
      name: 'Filters',
      description: 'Refine the results',
    })

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('data-rsbs-content', '')
  })

  it('preserves custom classes and forwards a content ref', () => {
    const ref = { current: null as HTMLDivElement | null }
    render(
      <Sheet.Root defaultOpen>
        <Sheet.Content ref={ref} className="product-sheet" aria-label="Cart" />
      </Sheet.Root>,
    )

    expect(ref.current).toBe(screen.getByRole('dialog'))
    expect(ref.current).toHaveClass('rsbs-content', 'product-sheet')
  })

  it('adds namespaced classes without replacing consumer classes', () => {
    render(
      <Sheet.Root defaultOpen>
        <Sheet.Trigger className="product-trigger">Open</Sheet.Trigger>
        <Sheet.Content aria-label="Cart">
          <Sheet.Handle className="product-handle" />
          <Sheet.Title className="product-title">Cart</Sheet.Title>
          <Sheet.Description className="product-description">
            Current items
          </Sheet.Description>
          <Sheet.Close className="product-close">Done</Sheet.Close>
        </Sheet.Content>
      </Sheet.Root>,
    )

    expect(screen.getByRole('button', { name: 'Open' })).toHaveClass(
      'rsbs-trigger',
      'product-trigger',
    )
    expect(document.querySelector('[data-rsbs-handle]')).toHaveClass(
      'rsbs-handle',
      'product-handle',
    )
    expect(screen.getByText('Cart')).toHaveClass('rsbs-title', 'product-title')
    expect(screen.getByText('Current items')).toHaveClass(
      'rsbs-description',
      'product-description',
    )
    expect(screen.getByRole('button', { name: 'Done' })).toHaveClass(
      'rsbs-close',
      'product-close',
    )
  })

  it('dismisses through the backdrop without treating child clicks as dismissal', () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet.Root defaultOpen onOpenChange={onOpenChange}>
        <Sheet.Backdrop>
          <button>Backdrop child</button>
        </Sheet.Backdrop>
        <Sheet.Content aria-label="Filters" />
      </Sheet.Root>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Backdrop child' }))
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.click(document.querySelector('[data-rsbs-backdrop]')!)
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'backdrop' })
  })
})
