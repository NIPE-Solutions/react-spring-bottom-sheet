import type { Metadata } from 'next'
import { Examples } from '../../components/Examples'

export const metadata: Metadata = {
  title: 'Examples',
  description: 'Interactive version 5 bottom-sheet patterns.',
  alternates: { canonical: '/examples/' },
}

export default function ExamplesPage() {
  return (
    <main id="content" className="doc-page examples-page">
      <header>
        <p className="route">laboratory</p>
        <h1>Examples</h1>
        <p>Exercise real library behavior, not a visual imitation.</p>
      </header>
      <Examples />
    </main>
  )
}
