import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import type { MouseEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Sheet } from '../components/Sheet.js'

describe('asChild composition', () => {
  it('renders a trigger without an additional wrapper', () => {
    render(
      <Sheet.Root>
        <Sheet.Trigger asChild>
          <a href="#filters">Open filters</a>
        </Sheet.Trigger>
        <Sheet.Content aria-label="Filters" />
      </Sheet.Root>,
    )

    const trigger = screen.getByRole('link', { name: 'Open filters' })
    expect(trigger).toHaveAttribute('data-rsbs-trigger', '')
    expect(trigger.querySelector('[data-rsbs-trigger]')).toBeNull()
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'data-rsbs-state',
      'open',
    )
  })

  it('runs the child handler first and honors preventDefault', () => {
    const rootHandler = vi.fn()
    const childHandler = vi.fn((event: MouseEvent) => event.preventDefault())
    render(
      <Sheet.Root onOpenChange={rootHandler}>
        <Sheet.Trigger asChild>
          <button onClick={childHandler}>Open</button>
        </Sheet.Trigger>
        <Sheet.Content aria-label="Filters" />
      </Sheet.Root>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(childHandler).toHaveBeenCalledOnce()
    expect(rootHandler).not.toHaveBeenCalled()
  })

  it('merges the child ref and forwarded ref', () => {
    const childRef = createRef<HTMLButtonElement>()
    const forwardedRef = createRef<HTMLButtonElement>()
    render(
      <Sheet.Root>
        <Sheet.Trigger asChild ref={forwardedRef}>
          <button ref={childRef}>Open</button>
        </Sheet.Trigger>
      </Sheet.Root>,
    )

    const button = screen.getByRole('button', { name: 'Open' })
    expect(childRef.current).toBe(button)
    expect(forwardedRef.current).toBe(button)
  })

  it('supports replacement elements across every visible primitive', () => {
    render(
      <Sheet.Root defaultOpen modal={false}>
        <Sheet.Backdrop asChild>
          <section data-testid="backdrop" />
        </Sheet.Backdrop>
        <Sheet.Viewport asChild>
          <main>
            <Sheet.Content asChild aria-label="Filters">
              <article>
                <Sheet.Handle asChild>
                  <button>Drag</button>
                </Sheet.Handle>
                <Sheet.Title asChild>
                  <h1>Custom title</h1>
                </Sheet.Title>
                <Sheet.Description asChild>
                  <div>Custom description</div>
                </Sheet.Description>
                <Sheet.Close asChild>
                  <a href="#close">Close</a>
                </Sheet.Close>
              </article>
            </Sheet.Content>
          </main>
        </Sheet.Viewport>
      </Sheet.Root>,
    )

    expect(screen.getByTestId('backdrop').tagName).toBe('SECTION')
    expect(document.querySelector('[data-rsbs-viewport]')?.tagName).toBe('MAIN')
    expect(screen.getByRole('dialog').tagName).toBe('ARTICLE')
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute(
      'data-rsbs-title',
      '',
    )
    expect(screen.getByRole('button', { name: 'Drag' })).toHaveAttribute(
      'data-rsbs-handle',
      '',
    )
    expect(screen.getByRole('link', { name: 'Close' })).toHaveAttribute(
      'data-rsbs-close',
      '',
    )
  })
})
