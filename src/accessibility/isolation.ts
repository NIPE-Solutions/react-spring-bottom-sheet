interface IsolatedElement {
  element: HTMLElement
  ariaHidden: string | null
  inert: boolean
}

export function isolateBackground(content: HTMLElement): () => void {
  const isolated = new Map<HTMLElement, IsolatedElement>()
  let pathElement = content
  let parent = content.parentElement

  while (parent) {
    for (const element of parent.children) {
      if (!(element instanceof HTMLElement)) continue
      if (element === pathElement) continue
      if (
        element.hasAttribute('data-rsbs-backdrop') ||
        element.querySelector('[data-rsbs-backdrop]')
      ) {
        continue
      }
      if (isolated.has(element)) continue

      isolated.set(element, {
        element,
        ariaHidden: element.getAttribute('aria-hidden'),
        inert: element.inert,
      })
      element.setAttribute('aria-hidden', 'true')
      element.inert = true
    }

    if (parent === document.body) break
    pathElement = parent
    parent = parent.parentElement
  }

  return () => {
    for (const { element, ariaHidden, inert } of [
      ...isolated.values(),
    ].reverse()) {
      if (ariaHidden === null) element.removeAttribute('aria-hidden')
      else element.setAttribute('aria-hidden', ariaHidden)
      element.inert = inert
    }
  }
}
