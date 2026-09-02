export type GestureOwner = 'sheet' | 'content'

export interface ScrollBoundaryInput {
  deltaY: number
  scrollTop: number
  scrollHeight: number
  clientHeight: number
  startedOnHandle: boolean
}

export function decideGestureOwner({
  deltaY,
  scrollTop,
  scrollHeight,
  clientHeight,
  startedOnHandle,
}: ScrollBoundaryInput): GestureOwner {
  if (startedOnHandle) return 'sheet'

  const maximumScrollTop = Math.max(0, scrollHeight - clientHeight)

  if (maximumScrollTop <= 0) return 'sheet'
  if (deltaY < 0) {
    return scrollTop < maximumScrollTop ? 'content' : 'sheet'
  }
  if (deltaY > 0) {
    return scrollTop > 0 ? 'content' : 'sheet'
  }

  return 'content'
}

export function findScrollableAncestor(
  target: EventTarget | null,
  boundary: HTMLElement,
): HTMLElement | null {
  let element = target instanceof HTMLElement ? target : null

  while (element && element !== boundary) {
    const overflowY = getComputedStyle(element).overflowY
    if (
      element.scrollHeight > element.clientHeight &&
      ['auto', 'scroll', 'overlay'].includes(overflowY)
    )
      return element
    element = element.parentElement
  }

  return null
}
