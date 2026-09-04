import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CopySourceButton } from './CopySourceButton'
import { SourceInspector } from './SourceInspector'

function renderInspector(children = <pre>const open = true</pre>) {
  return render(
    <>
      <button type="button">Background action</button>
      <SourceInspector filename="BasicSheet.tsx">{children}</SourceInspector>
    </>,
  )
}

async function openInspector() {
  const trigger = screen.getByRole('button', { name: 'View source' })
  fireEvent.click(trigger)
  const dialog = await screen.findByRole('dialog', {
    name: 'BasicSheet.tsx source',
  })

  return { dialog, trigger }
}

function mockReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' && matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    })),
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.style.overflow = ''
  document.body.style.paddingInlineEnd = ''
  mockReducedMotion(false)
})

describe('SourceInspector', () => {
  it('is closed by default and uses the configured trigger label', () => {
    render(
      <SourceInspector filename="BasicSheet.tsx" triggerLabel="Inspect recipe">
        <pre>const open = true</pre>
      </SourceInspector>,
    )

    expect(screen.getByRole('button', { name: 'Inspect recipe' })).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('const open = true')).not.toBeInTheDocument()
  })

  it('opens a named modal and moves focus to its close button', async () => {
    renderInspector()

    const { dialog } = await openInspector()

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('data-state', 'open')
    expect(screen.getByRole('button', { name: 'Close source' })).toHaveFocus()
  })

  it('contains forward, reverse, and programmatic focus movement', async () => {
    const { container } = renderInspector(
      <button type="button">Last source action</button>,
    )
    const { dialog } = await openInspector()
    const close = screen.getByRole('button', { name: 'Close source' })
    const last = screen.getByRole('button', { name: 'Last source action' })

    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(close).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()

    container.querySelector<HTMLButtonElement>('button')!.focus()
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
  })

  it.each([
    ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
    [
      'close button',
      () =>
        fireEvent.click(screen.getByRole('button', { name: 'Close source' })),
    ],
    [
      'backdrop',
      () =>
        fireEvent.click(
          document.querySelector<HTMLElement>(
            '[data-source-inspector-backdrop]',
          )!,
        ),
    ],
  ])('dismisses with %s and restores trigger focus', async (_, dismiss) => {
    renderInspector()
    const { trigger } = await openInspector()
    const restoreFocus = vi.spyOn(trigger, 'focus')

    dismiss()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(restoreFocus).toHaveBeenCalledWith({ preventScroll: true })
    expect(trigger).toHaveFocus()
  })

  it('does not treat a click inside the dialog as a backdrop dismissal', async () => {
    renderInspector()
    const { dialog } = await openInspector()

    fireEvent.click(dialog)

    expect(dialog).toBeVisible()
  })

  it('keeps only the inert shell for the exit transform', async () => {
    renderInspector()
    const { dialog } = await openInspector()
    const layer = dialog.parentElement!

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(layer).toHaveAttribute('data-state', 'closed')
      expect(dialog).toHaveAttribute('data-state', 'closed')
      expect(dialog).toHaveAttribute('inert')
      expect(screen.queryByText('const open = true')).not.toBeInTheDocument()
    })

    fireEvent.transitionEnd(dialog, { propertyName: 'transform' })
    expect(layer).not.toBeInTheDocument()
  })

  it('suppresses and restores background interaction while locking body scroll', async () => {
    document.body.style.overflow = 'clip'
    const { container, unmount } = renderInspector()
    const initialInert = container.inert

    await openInspector()

    expect(container).toHaveAttribute('aria-hidden', 'true')
    expect(container.inert).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(container).not.toHaveAttribute('aria-hidden')
    expect(container.inert).toBe(initialInert)
    expect(document.body.style.overflow).toBe('clip')

    fireEvent.click(screen.getByRole('button', { name: 'View source' }))
    await screen.findByRole('dialog')
    unmount()
    expect(document.body.style.overflow).toBe('clip')
    expect(container).not.toHaveAttribute('aria-hidden')
    expect(container.inert).toBe(initialInert)
  })

  it('compensates a classic scrollbar so preview geometry stays fixed', async () => {
    vi.stubGlobal('innerWidth', 1000)
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(
      980,
    )
    document.body.style.paddingInlineEnd = '7px'
    const { container } = renderInspector()
    const previewWidth = () => {
      const viewportWidth =
        document.body.style.overflow === 'hidden'
          ? window.innerWidth
          : document.documentElement.clientWidth
      const inlineEndPadding =
        Number.parseFloat(document.body.style.paddingInlineEnd) || 0
      return viewportWidth - inlineEndPadding
    }
    const widthBeforeOpen = previewWidth()

    await openInspector()

    expect(document.body.style.paddingInlineEnd).toBe('27px')
    expect(previewWidth()).toBe(widthBeforeOpen)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.style.paddingInlineEnd).toBe('7px')
    expect(previewWidth()).toBe(widthBeforeOpen)
    expect(container).not.toHaveAttribute('aria-hidden')
  })

  it('marks reduced-motion state and removes the portal immediately on close', async () => {
    mockReducedMotion(true)
    renderInspector()
    const { dialog } = await openInspector()
    const layer = dialog.closest('[data-reduced-motion]')

    expect(layer).toHaveAttribute('data-reduced-motion', '')
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(layer).not.toBeInTheDocument()
  })

  it('keeps the selection copy fallback inside the modal until the canonical source reaches the copy sink', async () => {
    const source = 'const open = true\n'
    let copiedSelection = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn(() => Promise.reject(new Error('blocked'))) },
    })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => {
        const target = document.querySelector(
          '[data-copy-fallback-root] textarea',
        )
        if (!(target instanceof HTMLTextAreaElement)) return false
        copiedSelection = target.value.slice(
          target.selectionStart ?? 0,
          target.selectionEnd ?? 0,
        )
        return copiedSelection === source
      }),
    })
    renderInspector(<CopySourceButton source={source} />)
    await openInspector()
    const copyButton = screen.getByRole('button', { name: 'Copy source' })

    copyButton.focus()
    fireEvent.click(copyButton)

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Copied'),
    )
    expect(copiedSelection).toBe(source)
    expect(document.querySelector('textarea')).not.toBeInTheDocument()
    expect(copyButton).toHaveFocus()
  })

  it('keeps dismissal and restored focus stable after a copy failure', async () => {
    let rejectCopy!: (reason?: unknown) => void
    const pendingCopy = new Promise<void>((_, reject) => {
      rejectCopy = reject
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn(() => pendingCopy) },
    })
    renderInspector(<CopySourceButton source="const open = true\n" />)
    const { trigger } = await openInspector()

    fireEvent.click(screen.getByRole('button', { name: 'Copy source' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    await act(async () => rejectCopy(new Error('Clipboard unavailable')))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('textarea')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
