interface IsolatedElement {
  element: HTMLElement
  ariaHidden: string | null
  inert: boolean
}

export function isolateBackground(content: HTMLElement): () => void {
  const isolated: IsolatedElement[] = []

  for (const element of document.body.children) {
    if (!(element instanceof HTMLElement)) continue
    if (element === content || element.contains(content)) continue
    if (element.hasAttribute('data-rsbs-backdrop')) continue

    isolated.push({
      element,
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.inert,
    })
    element.setAttribute('aria-hidden', 'true')
    element.inert = true
  }

  return () => {
    for (const { element, ariaHidden, inert } of isolated) {
      if (ariaHidden === null) element.removeAttribute('aria-hidden')
      else element.setAttribute('aria-hidden', ariaHidden)
      element.inert = inert
    }
  }
}
