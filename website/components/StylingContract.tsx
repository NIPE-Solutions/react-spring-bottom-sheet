import Link from 'next/link'

export function StylingContract() {
  return (
    <section className="docs-home-feature docs-home-feature-styling">
      <div>
        <p className="docs-home-kicker">Styling contract</p>
        <h2>Your visual system stays yours.</h2>
        <p>
          Import the complete default presentation, or keep only the mechanical
          layout and replace every visual decision. Low-specificity rules and a
          dedicated namespace keep library styles away from application classes.
        </p>
        <Link href="/docs/styling/">Read the styling contract</Link>
      </div>
      <div className="docs-style-layers" aria-label="Stylesheet layers">
        <div>
          <span>Required mechanics</span>
          <code>core.css</code>
          <p>Positioning, gestures, viewport, and transition state.</p>
        </div>
        <div>
          <span>Optional presentation</span>
          <code>theme.css</code>
          <p>Color, radius, backdrop, handle, and surface defaults.</p>
        </div>
        <div>
          <span>Your product</span>
          <code>your-theme.css</code>
          <p>Ordinary selectors, stable hooks, complete visual ownership.</p>
        </div>
      </div>
    </section>
  )
}
