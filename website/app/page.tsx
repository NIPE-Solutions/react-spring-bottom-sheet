import Link from 'next/link'
import { Evidence } from '../components/Evidence'
import { LiveSheet } from '../components/LiveSheet'
import { QuickStart } from '../components/QuickStart'
import { RecipeLinks } from '../components/RecipeLinks'
import { buildEvidence } from '../content/evidence'

export default function Home() {
  return (
    <main id="content" className="docs-home" tabIndex={-1}>
      <section className="docs-hero">
        <div className="docs-hero-copy">
          <p className="docs-status">
            <span /> Version {buildEvidence.version} · React 19
          </p>
          <h1>A bottom sheet with boundaries you can trust.</h1>
          <p className="docs-lede">
            Accessible composition, predictable gestures, and a styling contract
            that stays out of your application’s way.
          </p>
          <div className="docs-actions">
            <Link
              className="docs-button docs-button-primary"
              href="/docs/installation/"
            >
              Get started
            </Link>
            <Link className="docs-button" href="/docs/api/">
              Read the API
            </Link>
          </div>
        </div>
        <LiveSheet />
      </section>
      <Evidence evidence={buildEvidence} />
      <QuickStart />
      <RecipeLinks />
    </main>
  )
}
