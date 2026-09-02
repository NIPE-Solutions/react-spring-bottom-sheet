import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { docs } from '../content/docs.mjs'
import '../../src/styles/styles.css'
import './site.css'

const siteUrl = 'https://react-spring-bottom-sheet.nipesolutions.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'React Spring Bottom Sheet',
    template: '%s · React Spring Bottom Sheet',
  },
  description: 'Accessible, composable bottom sheets for React 19.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'React Spring Bottom Sheet',
    description: 'Accessible, composable bottom sheets for React 19.',
    url: siteUrl,
    siteName: 'React Spring Bottom Sheet',
    type: 'website',
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <header className="site-header">
          <Link className="wordmark" href="/">
            <span aria-hidden="true" className="wordmark-mark" />
            React Spring Bottom Sheet
          </Link>
          <nav aria-label="Primary navigation">
            <Link href="/docs/introduction/">Docs</Link>
            <Link href="/examples/">Examples</Link>
            <a href="https://github.com/NIPE-Solutions/react-spring-bottom-sheet">
              GitHub
            </a>
          </nav>
        </header>
        <div className="site-grid">
          <aside className="docs-nav" aria-label="Documentation">
            <p>Version 5 alpha</p>
            {docs.map((page) => (
              <Link key={page.slug} href={`/docs/${page.slug}/`}>
                {page.title}
              </Link>
            ))}
          </aside>
          {children}
        </div>
        <footer className="site-footer">
          <span>MIT licensed · independently maintained by NIPE Solutions</span>
          <a href="https://github.com/stipsan/react-spring-bottom-sheet">
            Original project
          </a>
        </footer>
      </body>
    </html>
  )
}
