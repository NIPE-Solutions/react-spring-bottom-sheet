import Link from 'next/link'
import type { DocPage } from '../content/types'

export function PageNavigation({
  previous,
  next,
}: {
  previous?: DocPage
  next?: DocPage
}) {
  if (!previous && !next) return null

  return (
    <nav className="docs-page-navigation" aria-label="Pagination">
      {previous ? (
        <Link
          aria-label={`Previous: ${previous.title}`}
          href={`/docs/${previous.slug}/`}
        >
          <span>Previous</span>
          <strong>{previous.title}</strong>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link aria-label={`Next: ${next.title}`} href={`/docs/${next.slug}/`}>
          <span>Next</span>
          <strong>{next.title}</strong>
        </Link>
      ) : null}
    </nav>
  )
}
