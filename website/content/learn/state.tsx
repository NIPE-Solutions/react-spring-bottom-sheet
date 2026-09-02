import Link from 'next/link'

export function StateGuide() {
  return (
    <>
      <section id="open-state">
        <h2>Open state</h2>
        <p>
          Use <code>defaultOpen</code> when the sheet owns its state. Use
          <code> open</code> with <code>onOpenChange</code> when routing, a
          form, or another component needs to know whether the sheet is open.
        </p>
        <p>
          The callback includes a reason such as trigger, close, Escape,
          backdrop, drag, or imperative change. Controlled props remain
          authoritative: update state in the callback or the visible state will
          not change.
        </p>
        <p>
          <Link href="/examples/controlled/">
            Run the controlled-state recipe
          </Link>
        </p>
      </section>
      <section id="snap-state">
        <h2>Snap state</h2>
        <p>
          Name destinations after meaning rather than height. Pair
          <code> activeSnapPoint</code> with <code>onSnapPointChange</code> when
          the application needs to coordinate compact and expanded layouts.
        </p>
        <p>
          <Link href="/examples/snap-points/">Control named snap points</Link>
        </p>
      </section>
    </>
  )
}
