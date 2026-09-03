import Link from 'next/link'

export function SnapPointsGuide() {
  return (
    <>
      <section id="values">
        <h2>Values</h2>
        <p>
          Every destination has a stable <code>id</code>. Its value can be a
          pixel number, a <code>px</code> string, a percentage of the viewport,
          or
          <code> content</code> for measured content height.
        </p>
        <pre>
          <code>{`const snapPoints = [
  { id: 'compact', value: '35%' },
  { id: 'expanded', value: '82%' },
] as const`}</code>
        </pre>
        <p>
          Prefer names such as compact, expanded, or content over numeric names.
          The ID is application state; the value is a layout decision.
        </p>
      </section>
      <section id="reconciliation">
        <h2>Reconciliation</h2>
        <p>
          Destinations resolve again when content, the viewport, or the visual
          viewport changes. If the active destination disappears, the nearest
          valid destination is selected.
        </p>
        <p>
          <Link href="/examples/content-height/">
            See content height update live
          </Link>
        </p>
      </section>
    </>
  )
}
