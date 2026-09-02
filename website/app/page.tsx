import Link from 'next/link'
import { LiveSheet } from '../components/LiveSheet'

export default function Home() {
  return (
    <main id="content" className="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="status">
            <span /> Version 5 alpha · React 19
          </p>
          <h1>A bottom sheet with boundaries you can trust.</h1>
          <p className="lede">
            Accessible composition, predictable gestures, and a styling contract
            that stays out of your application’s way.
          </p>
          <div className="actions">
            <Link className="button primary" href="/docs/installation/">
              Get started
            </Link>
            <Link className="button" href="/docs/api/">
              Read the API
            </Link>
          </div>
          <pre className="install" tabIndex={0}>
            <code>npm install @nipe-solutions/react-spring-bottom-sheet</code>
          </pre>
        </div>
        <LiveSheet />
      </section>
      <section className="principles" aria-labelledby="principles-title">
        <h2 id="principles-title">Designed as a system</h2>
        <div>
          <article>
            <h3>Compose the anatomy</h3>
            <p>
              Use explicit primitives or the convenience component. Both paths
              share one implementation.
            </p>
          </article>
          <article>
            <h3>Own your visuals</h3>
            <p>
              Keep the default theme, replace every visual rule, or build from
              stable tokens.
            </p>
          </article>
          <article>
            <h3>Keep behavior stable</h3>
            <p>
              Motion is an internal adapter. Your API does not change when its
              implementation does.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
