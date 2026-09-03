import Link from 'next/link'

export function AccessibilityProof() {
  return (
    <section className="docs-home-feature docs-home-feature-accessibility">
      <div>
        <p className="docs-home-kicker">Accessible foundations</p>
        <h2>Accessibility is runtime behavior.</h2>
        <p>
          Semantic roles are only the beginning. Modal sheets establish an
          accessible name, move and contain focus, isolate background content,
          handle Escape, and restore focus after the closing motion.
        </p>
        <Link href="/docs/accessibility/">Review accessibility behavior</Link>
      </div>
      <ul className="docs-proof-list">
        <li>
          <span>01</span>
          <strong>Focus lifecycle</strong>
          <p>Entry, containment, dismissal, and restoration are coordinated.</p>
        </li>
        <li>
          <span>02</span>
          <strong>Modal or complementary</strong>
          <p>
            Choose isolation deliberately instead of faking it with z-index.
          </p>
        </li>
        <li>
          <span>03</span>
          <strong>Reduced motion</strong>
          <p>The same state machine settles without decorative movement.</p>
        </li>
      </ul>
    </section>
  )
}
