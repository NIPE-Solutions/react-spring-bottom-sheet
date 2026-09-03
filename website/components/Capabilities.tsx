import Link from 'next/link'

const capabilities = [
  {
    index: '01',
    title: 'Composition without hidden structure',
    body: 'Use the complete BottomSheet for the common case or assemble focused Sheet primitives when your product needs a different hierarchy.',
    href: '/docs/anatomy/',
  },
  {
    index: '02',
    title: 'Gestures that yield to content',
    body: 'Drag ownership follows scroll boundaries, then hands movement to the sheet without making nested content feel trapped.',
    href: '/docs/gestures/',
  },
  {
    index: '03',
    title: 'Named destinations, predictable state',
    body: 'Model compact, expanded, and content-sized destinations by meaning and control them with ordinary React state.',
    href: '/docs/snap-points/',
  },
  {
    index: '04',
    title: 'Motion with a complete close',
    body: 'Opening, interruption, dismissal, unmounting, and focus restoration share one lifecycle instead of competing timers.',
    href: '/docs/events/',
  },
] as const

export function Capabilities() {
  return (
    <section className="docs-capabilities" aria-labelledby="capabilities-title">
      <header>
        <p>Product behavior</p>
        <div>
          <h2 id="capabilities-title">Built for the difficult parts.</h2>
          <p>
            A bottom sheet is easy until scrolling, focus, motion, and
            application state meet. Version 5 gives each concern an explicit
            boundary.
          </p>
        </div>
      </header>
      <div className="docs-capability-grid">
        {capabilities.map((capability) => (
          <article key={capability.index}>
            <p className="docs-capability-index">{capability.index}</p>
            <h3>{capability.title}</h3>
            <p>{capability.body}</p>
            <Link href={capability.href}>Explore the behavior</Link>
          </article>
        ))}
      </div>
    </section>
  )
}
