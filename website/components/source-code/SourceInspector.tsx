'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type TransitionEvent,
} from 'react'
import { createPortal } from 'react-dom'

const EXIT_DURATION_MS = 220
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

type IsolatedElement = {
  element: HTMLElement
  ariaHidden: string | null
  inert: boolean
}

export type SourceInspectorProps = Readonly<{
  filename: string
  children: ReactNode
  triggerLabel?: string
}>

function focusableElements(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) =>
      !element.hidden &&
      !element.inert &&
      element.getAttribute('aria-hidden') !== 'true',
  )
}

function containFocus(event: KeyboardEvent, dialog: HTMLElement) {
  if (event.key !== 'Tab') return
  const focusable = focusableElements(dialog)
  const first = focusable[0] ?? dialog
  const last = focusable.at(-1) ?? dialog

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus({ preventScroll: true })
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus({ preventScroll: true })
  }
}

function isolateBackground(layer: HTMLElement) {
  const isolated: IsolatedElement[] = []

  for (const element of document.body.children) {
    if (!(element instanceof HTMLElement) || element === layer) continue
    isolated.push({
      element,
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.inert,
    })
    element.setAttribute('aria-hidden', 'true')
    element.inert = true
  }

  return () => {
    for (const { element, ariaHidden, inert } of isolated.reverse()) {
      if (ariaHidden === null) element.removeAttribute('aria-hidden')
      else element.setAttribute('aria-hidden', ariaHidden)
      element.inert = inert
    }
  }
}

export function SourceInspector({
  filename,
  children,
  triggerLabel = 'View source',
}: SourceInspectorProps) {
  const titleId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const openingFrame = useRef<number | null>(null)
  const dismissTimer = useRef<number | null>(null)
  const reducedMotionRef = useRef(false)
  const [present, setPresent] = useState(false)
  const [open, setOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const finishDismissal = useCallback(() => {
    if (dismissTimer.current !== null) {
      window.clearTimeout(dismissTimer.current)
      dismissTimer.current = null
    }
    setPresent(false)
  }, [])

  const dismiss = useCallback(() => {
    if (openingFrame.current !== null) {
      window.cancelAnimationFrame(openingFrame.current)
      openingFrame.current = null
    }
    setOpen(false)

    if (reducedMotionRef.current) {
      finishDismissal()
      return
    }

    dismissTimer.current = window.setTimeout(finishDismissal, EXIT_DURATION_MS)
  }, [finishDismissal])

  function showInspector(event: MouseEvent<HTMLButtonElement>) {
    triggerRef.current = event.currentTarget
    if (dismissTimer.current !== null) {
      window.clearTimeout(dismissTimer.current)
      dismissTimer.current = null
    }
    if (openingFrame.current !== null) {
      window.cancelAnimationFrame(openingFrame.current)
    }

    const prefersReducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    reducedMotionRef.current = prefersReducedMotion ?? false
    setReducedMotion(reducedMotionRef.current)
    setPresent(true)
    openingFrame.current = window.requestAnimationFrame(() => {
      openingFrame.current = null
      setOpen(true)
    })
  }

  useEffect(() => {
    return () => {
      if (openingFrame.current !== null) {
        window.cancelAnimationFrame(openingFrame.current)
      }
      if (dismissTimer.current !== null) {
        window.clearTimeout(dismissTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    const layer = layerRef.current
    const dialog = dialogRef.current
    if (!open || !layer || !dialog) return

    const previousOverflow = document.body.style.overflow
    const previousPaddingInlineEnd = document.body.style.paddingInlineEnd
    const viewportWidth = document.documentElement.clientWidth
    const scrollbarWidth =
      viewportWidth > 0 ? Math.max(0, window.innerWidth - viewportWidth) : 0
    const restoreBackground = isolateBackground(layer)
    if (scrollbarWidth > 0) {
      const computedPaddingInlineEnd =
        Number.parseFloat(getComputedStyle(document.body).paddingInlineEnd) || 0
      document.body.style.paddingInlineEnd = `${computedPaddingInlineEnd + scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        dismiss()
      } else {
        containFocus(event, dialog)
      }
    }
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) {
        ;(closeRef.current ?? dialog).focus({ preventScroll: true })
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
    closeRef.current?.focus({ preventScroll: true })

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
      restoreBackground()
      document.body.style.overflow = previousOverflow
      document.body.style.paddingInlineEnd = previousPaddingInlineEnd
      if (triggerRef.current?.isConnected) {
        triggerRef.current.focus({ preventScroll: true })
      }
    }
  }, [dismiss, open])

  function finishPanelTransition(event: TransitionEvent<HTMLDivElement>) {
    if (
      !open &&
      event.target === event.currentTarget &&
      event.propertyName === 'transform'
    ) {
      finishDismissal()
    }
  }

  return (
    <>
      <button
        className="docs-source-inspector-trigger"
        ref={triggerRef}
        type="button"
        onClick={showInspector}
      >
        {triggerLabel}
      </button>
      {present
        ? createPortal(
            <div
              aria-hidden={!open || undefined}
              className="docs-source-inspector"
              data-reduced-motion={reducedMotion ? '' : undefined}
              data-state={open ? 'open' : 'closed'}
              ref={layerRef}
            >
              <div
                aria-hidden="true"
                className="docs-source-inspector-backdrop"
                data-source-inspector-backdrop=""
                onClick={dismiss}
              />
              <div
                aria-labelledby={titleId}
                aria-modal="true"
                className="docs-source-inspector-panel"
                data-copy-fallback-root=""
                data-state={open ? 'open' : 'closed'}
                inert={!open}
                onTransitionEnd={finishPanelTransition}
                ref={dialogRef}
                role="dialog"
                tabIndex={-1}
              >
                <header className="docs-source-inspector-header">
                  <div>
                    <p>Complete implementation</p>
                    <h2 id={titleId}>{filename} source</h2>
                  </div>
                  <button ref={closeRef} type="button" onClick={dismiss}>
                    Close source
                  </button>
                </header>
                {open ? (
                  <div className="docs-source-inspector-body">{children}</div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
