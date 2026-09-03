import type { ReactNode } from 'react'
import type { DocHeading, DocPage } from '../content/types'
import { DocsNavigation } from './DocsNavigation'
import { PageNavigation } from './PageNavigation'
import { TableOfContents } from './TableOfContents'

interface DocsShellProps {
  currentPage: DocPage
  headings: readonly DocHeading[]
  previous?: DocPage
  next?: DocPage
  children: ReactNode
}

export function DocsShell({
  currentPage,
  headings,
  previous,
  next,
  children,
}: DocsShellProps) {
  return (
    <div className="docs-shell">
      <aside className="docs-sidebar">
        <p className="docs-version">Version 5</p>
        <DocsNavigation currentSlug={currentPage.slug} />
      </aside>
      <details className="docs-mobile-nav">
        <summary>Browse documentation</summary>
        <DocsNavigation
          currentSlug={currentPage.slug}
          label="Mobile documentation"
        />
      </details>
      <main id="content" className="docs-page" tabIndex={-1}>
        <div className="docs-reading-layout">
          <details className="docs-mobile-toc">
            <summary>On this page</summary>
            <TableOfContents headings={headings} label="Mobile page contents" />
          </details>
          <article className="docs-article">
            {children}
            <PageNavigation previous={previous} next={next} />
          </article>
          <TableOfContents headings={headings} />
        </div>
      </main>
    </div>
  )
}
