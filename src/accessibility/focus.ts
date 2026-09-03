const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableElements(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) =>
      !element.hidden && element.getAttribute('aria-hidden') !== 'true',
  )
}

export function focusInitialElement(container: HTMLElement): void {
  const autofocus = container.querySelector<HTMLElement>('[autofocus]')
  const target = autofocus ?? focusableElements(container)[0] ?? container
  target.focus({ preventScroll: true })
}

export function containTabFocus(
  event: KeyboardEvent,
  container: HTMLElement,
): void {
  if (event.key !== 'Tab') return
  const focusable = focusableElements(container)
  if (focusable.length === 0) {
    event.preventDefault()
    container.focus({ preventScroll: true })
    return
  }

  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus({ preventScroll: true })
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus({ preventScroll: true })
  }
}
